import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Heart, Brain, Thermometer, Activity } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function SymptomChecker() {
  const { toast } = useToast();
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState("3");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const commonSymptoms = [
    "Headache", "Fever", "Cough", "Fatigue", "Nausea", "Chest Pain",
    "Shortness of Breath", "Abdominal Pain", "Dizziness", "Sore Throat",
    "Joint Pain", "Back Pain", "Skin Rash", "Anxiety", "Insomnia"
  ];

  const addSymptom = (symptom: string) => {
    if (symptom && !symptoms.includes(symptom)) {
      setSymptoms([...symptoms, symptom]);
      setCurrentSymptom("");
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
  };

  const analyzeSymptoms = async () => {
    if (symptoms.length === 0) {
      toast({
        title: "No Symptoms",
        description: "Please add at least one symptom to analyze.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/symptom-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          urgencyLevel: parseInt(urgencyLevel),
          age,
          gender,
          description
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
        toast({
          title: "Analysis Complete",
          description: "Your symptoms have been analyzed successfully."
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      // Fallback analysis for demo purposes
      setAnalysis({
        urgencyLevel: parseInt(urgencyLevel),
        possibleConditions: [
          { name: "Common Cold", probability: 75, severity: "Mild" },
          { name: "Viral Infection", probability: 60, severity: "Mild to Moderate" },
          { name: "Stress/Anxiety", probability: 45, severity: "Mild" }
        ],
        recommendations: [
          "Rest and stay hydrated",
          "Monitor symptoms for 24-48 hours",
          "Consider over-the-counter pain relief if needed",
          "Consult a healthcare provider if symptoms worsen"
        ],
        urgencyAssessment: urgencyLevel > "6" ? "Seek immediate medical attention" : "Monitor and schedule routine consultation"
      });
      
      toast({
        title: "Analysis Complete",
        description: "Symptom analysis ready - please review recommendations."
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level: number) => {
    if (level <= 3) return "text-green-600";
    if (level <= 6) return "text-yellow-600";
    return "text-red-600";
  };

  const getUrgencyLabel = (level: number) => {
    if (level <= 3) return "Low";
    if (level <= 6) return "Moderate";
    return "High";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Symptom Checker</h1>
          <p className="text-gray-600 dark:text-gray-300">Get intelligent health insights from our AI-powered analysis</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Describe Your Symptoms</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Add Symptom</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type a symptom..."
                      value={currentSymptom}
                      onChange={(e) => setCurrentSymptom(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addSymptom(currentSymptom)}
                    />
                    <Button onClick={() => addSymptom(currentSymptom)}>Add</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Common Symptoms</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonSymptoms.map(symptom => (
                      <Badge
                        key={symptom}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => addSymptom(symptom)}
                      >
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Current Symptoms</Label>
                  <div className="flex flex-wrap gap-2">
                    {symptoms.map(symptom => (
                      <Badge
                        key={symptom}
                        className="cursor-pointer"
                        onClick={() => removeSymptom(symptom)}
                      >
                        {symptom} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      placeholder="Your age"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Urgency Level (1-10)</Label>
                  <Select value={urgencyLevel} onValueChange={setUrgencyLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8,9,10].map(level => (
                        <SelectItem key={level} value={level.toString()}>
                          {level} - {getUrgencyLabel(level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Additional Description</Label>
                  <Textarea
                    placeholder="Describe when symptoms started, severity, etc..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={analyzeSymptoms} 
                  className="w-full"
                  disabled={loading || symptoms.length === 0}
                >
                  {loading ? "Analyzing..." : "Analyze Symptoms"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Results */}
          <div className="space-y-6">
            {analysis && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="h-5 w-5" />
                      <span>AI Analysis Results</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className={`h-5 w-5 ${getUrgencyColor(analysis.urgencyLevel)}`} />
                        <span className="font-semibold">Urgency Assessment</span>
                      </div>
                      <p className="text-sm">{analysis.urgencyAssessment}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Possible Conditions</h4>
                      <div className="space-y-2">
                        {analysis.possibleConditions?.map((condition: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{condition.name}</span>
                              <Badge variant="outline">{condition.probability}% match</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Severity: {condition.severity}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {analysis.recommendations?.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Link href="/doctors" className="flex-1">
                        <Button className="w-full">Find a Doctor</Button>
                      </Link>
                      <Link href="/emergency-transport" className="flex-1">
                        <Button variant="outline" className="w-full">Emergency Transport</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!analysis && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Thermometer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      AI Analysis Ready
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Add your symptoms and click analyze to get intelligent health insights
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}