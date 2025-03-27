import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DoctorWithUserInfo } from "@shared/schema";

// Types for symptoms and matching
interface SymptomCategory {
  id: string;
  name: string;
  symptoms: Array<{
    id: string;
    name: string;
  }>;
}

interface MatchResult {
  score: number;
  doctorId: number;
  specialty: string;
  reasoning: string;
}

export default function DoctorMatcher() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [urgency, setUrgency] = useState<string>("routine");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  const [specialty, setSpecialty] = useState<string>("");
  const [isMatchLoading, setIsMatchLoading] = useState(false);
  const [matchResults, setMatchResults] = useState<Array<MatchResult & { doctor: DoctorWithUserInfo }>>([]);
  
  // Fetch symptom categories
  const { data: categories = [], isLoading: isCategoriesLoading, isError: isCategoriesError } = useQuery<SymptomCategory[]>({
    queryKey: ["/api/doctor-match/symptom-categories"],
  });
  
  // Show error toast if categories failed to load
  useEffect(() => {
    if (isCategoriesError) {
      toast({
        title: "Error",
        description: "Failed to load symptom categories.",
        variant: "destructive",
      });
    }
  }, [isCategoriesError, toast]);
  
  // Fetch doctors for manual search
  const { data: allDoctors = [], isLoading: isDoctorsLoading } = useQuery({
    queryKey: ["/api/doctors"],
  });
  
  // Filter doctors by specialty
  const filteredDoctors = specialty 
    ? (allDoctors as DoctorWithUserInfo[]).filter(doc => doc.specialty === specialty)
    : (allDoctors as DoctorWithUserInfo[]);
  
  // Handle selecting/deselecting symptoms
  const toggleSymptom = (symptomId: string) => {
    if (selectedSymptoms.includes(symptomId)) {
      setSelectedSymptoms(selectedSymptoms.filter(id => id !== symptomId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomId]);
    }
  };
  
  // Handle doctor match submission
  const handleDoctorMatch = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the doctor matching service.",
        variant: "destructive",
      });
      return;
    }
    
    setIsMatchLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/doctor-match", {
        urgency,
        symptoms: selectedSymptoms,
        description,
        userId: user.id,
      });
      
      const data = await response.json();
      
      if (data && data.matches) {
        // Convert match results to include doctor information
        const doctorsWithScores = data.matches.map((match: MatchResult) => {
          const doctor = (allDoctors as DoctorWithUserInfo[]).find(d => d.id === match.doctorId);
          return { ...match, doctor };
        }).filter((item: any) => !!item.doctor);
        
        setMatchResults(doctorsWithScores);
        setStep(3);
      }
    } catch (error) {
      console.error("Error in doctor matching:", error);
      toast({
        title: "Matching Failed",
        description: "Unable to find matching doctors. Please try again or use manual search.",
        variant: "destructive",
      });
    } finally {
      setIsMatchLoading(false);
    }
  };
  
  // Book appointment with selected doctor
  const bookAppointment = (doctorId: number) => {
    setLocation(`/dashboard?bookAppointment=${doctorId}`);
  };
  
  return (
    <div className="mx-auto max-w-3xl">
      <Card className="shadow-lg">
        <CardHeader className="text-center bg-primary bg-opacity-10 border-b border-neutral-dark">
          <CardTitle className="flex items-center justify-center">
            <span className="material-icons mr-2 text-primary">medical_services</span>
            Telehealth Doctor Matching
          </CardTitle>
          <CardDescription>Find the right healthcare provider for your needs</CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <Tabs defaultValue="guided" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="guided">AI-Guided Match</TabsTrigger>
              <TabsTrigger value="manual">Manual Search</TabsTrigger>
            </TabsList>
            
            <TabsContent value="guided" className="pt-2">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">How urgent is your medical need?</h3>
                    <RadioGroup 
                      value={urgency} 
                      onValueChange={setUrgency}
                      className="grid grid-cols-1 gap-2 md:grid-cols-3"
                    >
                      <div className="flex items-center space-x-2 border p-3 rounded-md">
                        <RadioGroupItem value="urgent" id="urgent" />
                        <Label htmlFor="urgent" className="flex flex-col">
                          <span className="font-medium">Urgent</span>
                          <span className="text-xs text-text-secondary">Need help within 24 hours</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-md">
                        <RadioGroupItem value="soon" id="soon" />
                        <Label htmlFor="soon" className="flex flex-col">
                          <span className="font-medium">Soon</span>
                          <span className="text-xs text-text-secondary">Within a few days</span>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 border p-3 rounded-md">
                        <RadioGroupItem value="routine" id="routine" />
                        <Label htmlFor="routine" className="flex flex-col">
                          <span className="font-medium">Routine</span>
                          <span className="text-xs text-text-secondary">General checkup</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Select symptoms category</h3>
                    {isCategoriesLoading ? (
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {categories.map((category: SymptomCategory) => (
                          <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? "default" : "outline"}
                            className="justify-start"
                            onClick={() => setSelectedCategory(category.id)}
                          >
                            {category.name}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedCategory && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Select specific symptoms</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {categories
                          .find((c: SymptomCategory) => c.id === selectedCategory)
                          ?.symptoms.map(symptom => (
                            <div 
                              key={symptom.id}
                              className={`border p-3 rounded-md cursor-pointer ${
                                selectedSymptoms.includes(symptom.id) 
                                  ? "bg-primary bg-opacity-10 border-primary" 
                                  : ""
                              }`}
                              onClick={() => toggleSymptom(symptom.id)}
                            >
                              <div className="flex items-center">
                                <span className="material-icons text-sm mr-2">
                                  {selectedSymptoms.includes(symptom.id) ? "check_circle" : "circle"}
                                </span>
                                {symptom.name}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Additional details (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your symptoms or medical concerns in more detail..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={() => setStep(2)}>
                      Next Step
                    </Button>
                  </div>
                </div>
              )}
              
              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Review Your Information</h3>
                  
                  <div className="space-y-4 border-b pb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-sm text-text-secondary">Urgency</p>
                        <p className="font-medium capitalize">{urgency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-secondary">Category</p>
                        <p className="font-medium">
                          {categories.find((c: SymptomCategory) => c.id === selectedCategory)?.name || ""}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-text-secondary">Selected Symptoms</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedSymptoms.map(symptomId => {
                          const category = categories.find((c: SymptomCategory) => 
                            c.symptoms.some(s => s.id === symptomId)
                          );
                          const symptom = category?.symptoms.find(s => s.id === symptomId);
                          
                          return (
                            <span 
                              key={symptomId}
                              className="bg-neutral-dark px-2 py-1 rounded-full text-xs"
                            >
                              {symptom?.name || ""}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    
                    {description && (
                      <div>
                        <p className="text-sm text-text-secondary">Additional Details</p>
                        <p className="text-sm mt-1">{description}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button 
                      onClick={handleDoctorMatch}
                      disabled={isMatchLoading || selectedSymptoms.length === 0}
                    >
                      {isMatchLoading ? "Finding Matches..." : "Find Matching Doctors"}
                    </Button>
                  </div>
                </div>
              )}
              
              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Recommended Healthcare Providers</h3>
                  
                  {matchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <span className="material-icons text-4xl text-text-secondary">search_off</span>
                      <p className="mt-2 text-text-secondary">No matching doctors found</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setStep(1)}
                      >
                        Try Different Symptoms
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {matchResults.map((result) => (
                        <Card key={result.doctorId} className="border-l-4 border-l-primary">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  Dr. {result.doctor.user.firstName} {result.doctor.user.lastName}
                                </h4>
                                <p className="text-sm text-text-secondary">{result.doctor.specialty}</p>
                                <div className="mt-2 text-xs">
                                  <span className="font-medium">Match Score:</span> {result.score}%
                                </div>
                                <p className="mt-2 text-sm">{result.reasoning}</p>
                              </div>
                              <Button 
                                size="sm"
                                onClick={() => bookAppointment(result.doctor.id)}
                              >
                                Book Appointment
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setStep(1)}>
                          Start Over
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="manual" className="pt-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Select Specialty</Label>
                  <Select value={specialty} onValueChange={setSpecialty}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Specialties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Specialties</SelectItem>
                      <SelectItem value="General Physician">General Physician</SelectItem>
                      <SelectItem value="Pediatrician">Pediatrician</SelectItem>
                      <SelectItem value="Cardiologist">Cardiologist</SelectItem>
                      <SelectItem value="Dermatologist">Dermatologist</SelectItem>
                      <SelectItem value="Mental Health Specialist">Mental Health Specialist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Available Doctors</h3>
                  
                  {isDoctorsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : filteredDoctors.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      No doctors found for the selected specialty
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDoctors.map((doctor) => (
                        <Card key={doctor.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  Dr. {doctor.user.firstName} {doctor.user.lastName}
                                </h4>
                                <p className="text-sm text-text-secondary">{doctor.specialty}</p>
                                <div className="flex items-center mt-1">
                                  <span className="material-icons text-yellow-500 text-sm">star</span>
                                  <span className="text-xs ml-1">
                                    {doctor.averageRating || "New"} 
                                    {doctor.reviewCount ? ` (${doctor.reviewCount} reviews)` : ""}
                                  </span>
                                </div>
                              </div>
                              <Button 
                                size="sm"
                                onClick={() => bookAppointment(doctor.id)}
                              >
                                Book Appointment
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}