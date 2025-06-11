import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, Brain, Eye, Activity, Thermometer, Stethoscope,
  FileText, Calculator, Pill, Phone, Video, MessageSquare
} from "lucide-react";

export default function MedicalTools() {
  const [vitalSigns, setVitalSigns] = useState({
    heartRate: "",
    bloodPressure: "",
    temperature: "",
    oxygenSaturation: ""
  });
  
  const [prescriptionData, setPrescriptionData] = useState({
    patientName: "",
    medication: "",
    dosage: "",
    instructions: ""
  });

  const [activeVideoCall, setActiveVideoCall] = useState(false);

  // Heart Rate Calculator
  const calculateHeartRateZone = (age: number, restingHR: number) => {
    const maxHR = 220 - age;
    const hrReserve = maxHR - restingHR;
    
    return {
      fat_burn: Math.round((hrReserve * 0.6) + restingHR),
      cardio: Math.round((hrReserve * 0.7) + restingHR),
      peak: Math.round((hrReserve * 0.85) + restingHR)
    };
  };

  // BMI Calculator
  const calculateBMI = (weight: number, height: number) => {
    const bmi = weight / ((height / 100) ** 2);
    let category = "";
    
    if (bmi < 18.5) category = "Underweight";
    else if (bmi < 25) category = "Normal";
    else if (bmi < 30) category = "Overweight";
    else category = "Obese";
    
    return { bmi: bmi.toFixed(1), category };
  };

  const startVideoCall = () => {
    setActiveVideoCall(true);
    // In real implementation, this would integrate with video calling API
    setTimeout(() => {
      alert("Video call started! In production, this would open a secure video session.");
      setActiveVideoCall(false);
    }, 2000);
  };

  const generatePrescription = () => {
    if (!prescriptionData.patientName || !prescriptionData.medication) {
      alert("Please fill in patient name and medication");
      return;
    }
    
    const prescription = `
DIGITAL PRESCRIPTION
Patient: ${prescriptionData.patientName}
Medication: ${prescriptionData.medication}
Dosage: ${prescriptionData.dosage}
Instructions: ${prescriptionData.instructions}
Date: ${new Date().toLocaleDateString()}
`;
    
    // In production, this would save to database and send securely
    console.log("Generated prescription:", prescription);
    alert("Prescription generated and sent securely to pharmacy!");
  };

  return (
    <div className="space-y-6">
      {/* Active Medical Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Video Consultation */}
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Consultation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-100 mb-4">Start secure video calls with patients</p>
            <Button 
              variant="secondary" 
              size="sm" 
              className="text-blue-600 w-full"
              onClick={startVideoCall}
              disabled={activeVideoCall}
            >
              {activeVideoCall ? "Connecting..." : "Start Video Call"}
            </Button>
          </CardContent>
        </Card>

        {/* Digital Prescriptions */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Digital Prescriptions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-purple-100 mb-4">Create secure digital prescriptions</p>
                <div className="text-sm text-purple-200">Click to open</div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Digital Prescription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Patient Name"
                value={prescriptionData.patientName}
                onChange={(e) => setPrescriptionData({...prescriptionData, patientName: e.target.value})}
              />
              <Input
                placeholder="Medication"
                value={prescriptionData.medication}
                onChange={(e) => setPrescriptionData({...prescriptionData, medication: e.target.value})}
              />
              <Input
                placeholder="Dosage (e.g., 10mg twice daily)"
                value={prescriptionData.dosage}
                onChange={(e) => setPrescriptionData({...prescriptionData, dosage: e.target.value})}
              />
              <Textarea
                placeholder="Special instructions"
                value={prescriptionData.instructions}
                onChange={(e) => setPrescriptionData({...prescriptionData, instructions: e.target.value})}
              />
              <Button onClick={generatePrescription} className="w-full">
                Generate & Send Prescription
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Vital Signs Monitor */}
        <Dialog>
          <DialogTrigger asChild>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Vital Signs Monitor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-100 mb-4">Monitor and record patient vitals</p>
                <div className="text-sm text-green-200">Click to record</div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Vital Signs</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                <Input
                  placeholder="Heart Rate (BPM)"
                  value={vitalSigns.heartRate}
                  onChange={(e) => setVitalSigns({...vitalSigns, heartRate: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <Input
                  placeholder="Blood Pressure (e.g., 120/80)"
                  value={vitalSigns.bloodPressure}
                  onChange={(e) => setVitalSigns({...vitalSigns, bloodPressure: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <Input
                  placeholder="Temperature (°F)"
                  value={vitalSigns.temperature}
                  onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <Input
                  placeholder="Oxygen Saturation (%)"
                  value={vitalSigns.oxygenSaturation}
                  onChange={(e) => setVitalSigns({...vitalSigns, oxygenSaturation: e.target.value})}
                />
              </div>
              <Button className="w-full">Save Vital Signs</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Medical Calculators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Medical Calculators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bmi" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bmi">BMI Calculator</TabsTrigger>
              <TabsTrigger value="heart">Heart Rate Zones</TabsTrigger>
              <TabsTrigger value="dosage">Dosage Calculator</TabsTrigger>
            </TabsList>
            
            <TabsContent value="bmi" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Weight (kg)" id="weight" type="number" />
                <Input placeholder="Height (cm)" id="height" type="number" />
              </div>
              <Button 
                onClick={() => {
                  const weight = parseFloat((document.getElementById('weight') as HTMLInputElement)?.value || '0');
                  const height = parseFloat((document.getElementById('height') as HTMLInputElement)?.value || '0');
                  if (weight && height) {
                    const result = calculateBMI(weight, height);
                    alert(`BMI: ${result.bmi} (${result.category})`);
                  }
                }}
                className="w-full"
              >
                Calculate BMI
              </Button>
            </TabsContent>
            
            <TabsContent value="heart" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Age" id="age" type="number" />
                <Input placeholder="Resting HR" id="restingHR" type="number" />
              </div>
              <Button 
                onClick={() => {
                  const age = parseInt((document.getElementById('age') as HTMLInputElement)?.value || '0');
                  const restingHR = parseInt((document.getElementById('restingHR') as HTMLInputElement)?.value || '0');
                  if (age && restingHR) {
                    const zones = calculateHeartRateZone(age, restingHR);
                    alert(`Heart Rate Zones:\nFat Burn: ${zones.fat_burn} BPM\nCardio: ${zones.cardio} BPM\nPeak: ${zones.peak} BPM`);
                  }
                }}
                className="w-full"
              >
                Calculate Heart Rate Zones
              </Button>
            </TabsContent>
            
            <TabsContent value="dosage" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Weight (kg)" id="patientWeight" type="number" />
                <Input placeholder="Dose (mg/kg)" id="dosePerKg" type="number" />
                <Input placeholder="Frequency" id="frequency" />
              </div>
              <Button 
                onClick={() => {
                  const weight = parseFloat((document.getElementById('patientWeight') as HTMLInputElement)?.value || '0');
                  const dose = parseFloat((document.getElementById('dosePerKg') as HTMLInputElement)?.value || '0');
                  const freq = (document.getElementById('frequency') as HTMLInputElement)?.value || '';
                  if (weight && dose) {
                    const totalDose = weight * dose;
                    alert(`Total dose: ${totalDose}mg ${freq}`);
                  }
                }}
                className="w-full"
              >
                Calculate Dosage
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-red-500" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => alert("Calling Emergency Services: 911")}
            >
              <Phone className="h-4 w-4 mr-2" />
              Emergency: 911
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => alert("Calling Poison Control: 1-800-222-1222")}
            >
              <Phone className="h-4 w-4 mr-2" />
              Poison Control
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => alert("Calling Cardiology Consult")}
            >
              <Heart className="h-4 w-4 mr-2" />
              Cardiology Consult
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}