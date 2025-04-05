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
  doctorId: number;
  matchScore: number;
  matchReason: string;
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
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["/api/doctor-match/symptom-categories"],
  });
  
  // Fetch doctors for manual search
  const { data: allDoctors = [], isLoading: isDoctorsLoading } = useQuery({
    queryKey: ["/api/doctors"],
  });
  
  // Filter doctors by specialty
  const filteredDoctors = specialty 
    ? allDoctors.filter(doc => doc.specialty === specialty)
    : allDoctors;
  
  // Get available specialties from doctors
  const specialties = Array.from(new Set(allDoctors.map(doc => doc.specialty))).sort();
  
  // Handle symptom selection
  const handleSymptomSelect = (symptomId: string) => {
    if (selectedSymptoms.includes(symptomId)) {
      setSelectedSymptoms(selectedSymptoms.filter(id => id !== symptomId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptomId]);
    }
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };
  
  // Handle doctor matching
  const handleDoctorMatch = async () => {
    if (selectedSymptoms.length === 0) return;
    
    setIsMatchLoading(true);
    
    try {
      const urgencyMapping = {
        "emergency": 10,
        "urgent": 7,
        "soon": 5,
        "routine": 3
      };
      
      const urgencyLevel = urgencyMapping[urgency as keyof typeof urgencyMapping] || 3;
      
      // Use the better approach with proper error handling
      const response = await apiRequest("/api/doctor-match", {
        method: "POST",
        data: { 
          symptoms: selectedSymptoms,
          description,
          urgencyLevel
        }
      });
      
      console.log("Doctor match response:", response);
      
      if (response && response.matches && Array.isArray(response.matches)) {
        setMatchResults(response.matches);
        setStep(3);
      } else {
        console.error("Invalid response format", response);
        throw new Error("Invalid response format from doctor matching service");
      }
    } catch (error) {
      console.error("Failed to match doctors:", error);
      toast({
        title: "Error",
        description: "Failed to find matching doctors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMatchLoading(false);
    }
  };
  
  // Reset the form
  const handleReset = () => {
    setStep(1);
    setUrgency("routine");
    setSelectedCategory("");
    setSelectedSymptoms([]);
    setDescription("");
    setMatchResults([]);
  };
  
  return (
    <div className="p-4">
      <Tabs defaultValue="symptoms" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-900">
          <TabsTrigger value="symptoms" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Symptom Matcher</TabsTrigger>
          <TabsTrigger value="browse" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Browse Doctors</TabsTrigger>
        </TabsList>
        
        <TabsContent value="symptoms">
          {step === 1 && (
            <Card className="bg-gray-900 border border-gray-800">
              <CardHeader className="bg-blue-900 bg-opacity-30 border-b border-gray-800">
                <CardTitle className="text-white">Tell us about your symptoms</CardTitle>
                <CardDescription className="text-gray-400">
                  Select a category and the symptoms you're experiencing.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-200">
                {isCategoriesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full bg-gray-800" />
                    <Skeleton className="h-40 w-full bg-gray-800" />
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <Label htmlFor="urgency" className="mb-2 block text-gray-300">How soon do you need to see a doctor?</Label>
                      <RadioGroup 
                        id="urgency" 
                        value={urgency} 
                        onValueChange={setUrgency}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="emergency" id="emergency" />
                          <Label htmlFor="emergency" className="font-normal text-red-600">Emergency - Need immediate care</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="urgent" id="urgent" />
                          <Label htmlFor="urgent" className="font-normal text-orange-600">Urgent - Within 24 hours</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="soon" id="soon" />
                          <Label htmlFor="soon" className="font-normal text-yellow-600">Soon - Within a few days</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="routine" id="routine" />
                          <Label htmlFor="routine" className="font-normal">Routine checkup</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="mb-4">
                      <Label htmlFor="category" className="mb-2 block text-gray-300">Select a symptom category</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {categories.map((category) => (
                          <Button
                            key={category.id}
                            variant={selectedCategory === category.id ? "default" : "outline"}
                            onClick={() => handleCategorySelect(category.id)}
                            className={`justify-start ${selectedCategory === category.id ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"}`}
                          >
                            {category.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {selectedCategory && (
                      <div className="mb-4">
                        <Label className="mb-2 block text-gray-300">Select all symptoms that apply</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {categories
                            .find(cat => cat.id === selectedCategory)
                            ?.symptoms.map((symptom) => (
                              <div key={symptom.id} className="flex items-center">
                                <Button
                                  variant={selectedSymptoms.includes(symptom.id) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleSymptomSelect(symptom.id)}
                                  className={`justify-start w-full ${selectedSymptoms.includes(symptom.id) ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"}`}
                                >
                                  {symptom.name}
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <Label htmlFor="description" className="mb-2 block text-gray-300">Additional details (optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your symptoms in more detail..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      />
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t border-gray-800">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={isCategoriesLoading || selectedSymptoms.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {step === 2 && (
            <Card className="bg-gray-900 border border-gray-800">
              <CardHeader className="bg-blue-900 bg-opacity-30 border-b border-gray-800">
                <CardTitle className="text-white">Review your symptoms</CardTitle>
                <CardDescription className="text-gray-400">
                  Confirm your symptoms before we find matching doctors.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-200">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-gray-300">Urgency Level</h4>
                    <p className={`inline-block px-3 py-1 rounded-full text-sm ${
                      urgency === "emergency" ? "bg-red-900 bg-opacity-40 text-red-200 border border-red-800" :
                      urgency === "urgent" ? "bg-orange-900 bg-opacity-40 text-orange-200 border border-orange-800" :
                      urgency === "soon" ? "bg-yellow-900 bg-opacity-40 text-yellow-200 border border-yellow-800" :
                      "bg-green-900 bg-opacity-40 text-green-200 border border-green-800"
                    }`}>
                      {urgency === "emergency" ? "Emergency" :
                       urgency === "urgent" ? "Urgent (24 hours)" :
                       urgency === "soon" ? "Soon (Few days)" :
                       "Routine checkup"
                      }
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-gray-300">Selected Symptoms</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSymptoms.map(symptomId => {
                        const category = categories.find((c) => 
                          c.symptoms.some(s => s.id === symptomId)
                        );
                        const symptom = category?.symptoms.find(s => s.id === symptomId);
                        
                        return (
                          <span 
                            key={symptomId}
                            className="bg-blue-900 bg-opacity-40 text-blue-100 px-3 py-1 rounded-full text-xs border border-blue-800"
                          >
                            {symptom?.name || ""}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  
                  {description && (
                    <div>
                      <h4 className="font-medium mb-2 text-gray-300">Additional Details</h4>
                      <p className="text-sm text-gray-300">{description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-gray-800">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleDoctorMatch}
                  disabled={isMatchLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isMatchLoading ? "Finding doctors..." : "Find matching doctors"}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {step === 3 && (
            <Card className="bg-gray-900 border border-gray-800">
              <CardHeader className="bg-blue-900 bg-opacity-30 border-b border-gray-800">
                <CardTitle className="text-white">Matching Doctors</CardTitle>
                <CardDescription className="text-gray-400">
                  Based on your symptoms, we found these doctors who may be able to help.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-200">
                {matchResults.length > 0 ? (
                  <div className="space-y-4">
                    {matchResults.map((result) => (
                      <Card key={result.doctorId} className="border border-gray-700 bg-gray-800">
                        <CardHeader className="pb-2 bg-blue-900 bg-opacity-20 border-b border-gray-700">
                          <CardTitle className="text-lg text-white">
                            Dr. {result.doctor.user.firstName} {result.doctor.user.lastName}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {result.doctor.specialty} • Match Score: {Math.round(result.matchScore * 100)}%
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2 text-gray-300">
                          <p className="text-sm">{result.matchReason}</p>
                        </CardContent>
                        <CardFooter className="border-t border-gray-700">
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700" 
                            onClick={() => setLocation(`/dashboard?doctorId=${result.doctorId}&book=true`)}
                          >
                            Book Appointment
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">
                      No doctors found that match your symptoms. Please try with different symptoms or browse all doctors.
                    </p>
                    <Button 
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t border-gray-800">
                <Button 
                  variant="outline" 
                  onClick={handleReset}
                  className="bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
                >
                  Start Over
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="browse">
          <Card className="border border-gray-800">
            <CardHeader className="bg-blue-900 bg-opacity-30 border-b border-gray-800">
              <CardTitle>Browse All Doctors</CardTitle>
              <CardDescription>
                Search and filter by specialty to find the right doctor for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-1/3">
                    <Label htmlFor="specialty" className="mb-2 block">Filter by Specialty</Label>
                    <Select value={specialty} onValueChange={setSpecialty}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Specialties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Specialties</SelectItem>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty} value={specialty}>
                            {specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-full md:w-2/3">
                    <Label htmlFor="search" className="mb-2 block">Search by Name</Label>
                    <Input 
                      id="search" 
                      placeholder="Search doctors..." 
                      className="w-full" 
                    />
                  </div>
                </div>
                
                {isDoctorsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : filteredDoctors.length > 0 ? (
                  <div className="space-y-4">
                    {filteredDoctors.map((doctor) => (
                      <Card key={doctor.id} className="border">
                        <CardHeader className="pb-2 border-b border-gray-200 bg-blue-50">
                          <CardTitle className="text-lg">
                            Dr. {doctor.user.firstName} {doctor.user.lastName}
                          </CardTitle>
                          <CardDescription>
                            {doctor.specialty}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="mr-1 text-yellow-500">★</span>
                              <span>{doctor.averageRating.toFixed(1)}</span>
                              <span className="text-gray-500 text-sm ml-1">
                                ({doctor.reviewCount} reviews)
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${doctor.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {doctor.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="border-t border-gray-200">
                          <Button 
                            className="w-full" 
                            disabled={!doctor.isAvailable}
                            onClick={() => setLocation(`/dashboard?doctorId=${doctor.id}&book=true`)}
                          >
                            Book Appointment
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      No doctors found matching the selected specialty.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}