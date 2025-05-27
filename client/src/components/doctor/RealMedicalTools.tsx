import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Heart, Video, Pill, Activity, Phone, FileText, Stethoscope
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function RealMedicalTools() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPatient, setSelectedPatient] = useState("");
  const [prescriptionData, setPrescriptionData] = useState({
    patientId: "",
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    pharmacy: ""
  });
  
  const [vitalSigns, setVitalSigns] = useState({
    patientId: "",
    heartRate: "",
    bloodPressure: "",
    temperature: "",
    oxygenSaturation: "",
    notes: ""
  });

  // Get doctor info from Firebase
  const { data: doctorInfo } = useQuery({
    queryKey: ["/api/doctors"],
    select: (data) => {
      if (user && Array.isArray(data)) {
        return data.find((doctor) => doctor.userId === user.id);
      }
      return null;
    },
    enabled: !!user && user.role === "doctor",
  });

  // Get real patient data from Firebase appointments
  const { data: patients = [] } = useQuery({
    queryKey: ["/api/appointments", { doctorId: doctorInfo?.id }],
    enabled: !!doctorInfo,
    select: (data) => {
      if (Array.isArray(data)) {
        // Extract unique patients from appointments
        return data.reduce((acc: any[], appointment: any) => {
          if (appointment.patient && !acc.find(p => p.id === appointment.patient.id)) {
            acc.push(appointment.patient);
          }
          return acc;
        }, []);
      }
      return [];
    }
  });

  // Real prescription creation that saves to Firebase
  const prescriptionMutation = useMutation({
    mutationFn: async (prescriptionData: any) => {
      return apiRequest("POST", "/api/prescriptions", prescriptionData);
    },
    onSuccess: () => {
      toast({
        title: "Prescription Sent Successfully",
        description: "Digital prescription has been securely sent to patient and pharmacy.",
      });
      setPrescriptionData({
        patientId: "",
        medication: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
        pharmacy: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
    },
    onError: () => {
      toast({
        title: "Prescription Failed",
        description: "There was an error sending the prescription. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Real vital signs recording to Firebase
  const vitalSignsMutation = useMutation({
    mutationFn: async (vitalsData: any) => {
      return apiRequest("POST", "/api/vital-signs", vitalsData);
    },
    onSuccess: () => {
      toast({
        title: "Vital Signs Recorded",
        description: "Patient vital signs have been saved to medical record.",
      });
      setVitalSigns({
        patientId: "",
        heartRate: "",
        bloodPressure: "",
        temperature: "",
        oxygenSaturation: "",
        notes: ""
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vital-signs"] });
    },
    onError: () => {
      toast({
        title: "Recording Failed",
        description: "Could not save vital signs. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Start real video consultation
  const startVideoConsultation = (patientId: string) => {
    if (!patientId) {
      toast({
        title: "Select Patient",
        description: "Please select a patient to start video consultation.",
        variant: "destructive",
      });
      return;
    }

    // Create video consultation session in Firebase
    apiRequest("POST", "/api/video-consultation", {
      doctorId: doctorInfo?.id,
      patientId: patientId,
      sessionType: "consultation"
    }).then((response) => {
      const videoUrl = response.sessionUrl;
      window.open(videoUrl, '_blank');
      
      toast({
        title: "Video Call Started",
        description: "Secure video consultation has been initiated with patient.",
      });
    }).catch(() => {
      toast({
        title: "Video Call Failed",
        description: "Could not start video consultation. Please check connection.",
        variant: "destructive",
      });
    });
  };

  const handlePrescriptionSubmit = () => {
    if (!prescriptionData.patientId || !prescriptionData.medication) {
      toast({
        title: "Missing Information",
        description: "Please select patient and enter medication details.",
        variant: "destructive",
      });
      return;
    }

    prescriptionMutation.mutate({
      ...prescriptionData,
      doctorId: doctorInfo?.id,
      prescribedAt: new Date().toISOString(),
      status: "active"
    });
  };

  const handleVitalSignsSubmit = () => {
    if (!vitalSigns.patientId || !vitalSigns.heartRate) {
      toast({
        title: "Missing Information",
        description: "Please select patient and enter vital signs.",
        variant: "destructive",
      });
      return;
    }

    vitalSignsMutation.mutate({
      ...vitalSigns,
      doctorId: doctorInfo?.id,
      recordedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      {/* Real Video Consultation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            Start Video Consultation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedPatient} onValueChange={setSelectedPatient}>
            <SelectTrigger>
              <SelectValue placeholder="Select Patient for Video Call" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient: any) => (
                <SelectItem key={patient.id} value={patient.id.toString()}>
                  {patient.firstName} {patient.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => startVideoConsultation(selectedPatient)}
            className="w-full"
            disabled={!selectedPatient}
          >
            <Video className="h-4 w-4 mr-2" />
            Start Secure Video Call
          </Button>
        </CardContent>
      </Card>

      {/* Real Digital Prescription System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-purple-500" />
            Digital Prescription System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select 
            value={prescriptionData.patientId} 
            onValueChange={(value) => setPrescriptionData({...prescriptionData, patientId: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient: any) => (
                <SelectItem key={patient.id} value={patient.id.toString()}>
                  {patient.firstName} {patient.lastName} - {patient.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Medication Name"
              value={prescriptionData.medication}
              onChange={(e) => setPrescriptionData({...prescriptionData, medication: e.target.value})}
            />
            <Input
              placeholder="Dosage (e.g., 10mg)"
              value={prescriptionData.dosage}
              onChange={(e) => setPrescriptionData({...prescriptionData, dosage: e.target.value})}
            />
            <Input
              placeholder="Frequency (e.g., twice daily)"
              value={prescriptionData.frequency}
              onChange={(e) => setPrescriptionData({...prescriptionData, frequency: e.target.value})}
            />
            <Input
              placeholder="Duration (e.g., 7 days)"
              value={prescriptionData.duration}
              onChange={(e) => setPrescriptionData({...prescriptionData, duration: e.target.value})}
            />
          </div>
          
          <Textarea
            placeholder="Special instructions for patient"
            value={prescriptionData.instructions}
            onChange={(e) => setPrescriptionData({...prescriptionData, instructions: e.target.value})}
          />
          
          <Input
            placeholder="Pharmacy (optional)"
            value={prescriptionData.pharmacy}
            onChange={(e) => setPrescriptionData({...prescriptionData, pharmacy: e.target.value})}
          />
          
          <Button 
            onClick={handlePrescriptionSubmit}
            className="w-full"
            disabled={prescriptionMutation.isPending}
          >
            {prescriptionMutation.isPending ? "Sending..." : "Send Digital Prescription"}
          </Button>
        </CardContent>
      </Card>

      {/* Real Vital Signs Recording */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            Record Vital Signs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select 
            value={vitalSigns.patientId} 
            onValueChange={(value) => setVitalSigns({...vitalSigns, patientId: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient: any) => (
                <SelectItem key={patient.id} value={patient.id.toString()}>
                  {patient.firstName} {patient.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <Input
                placeholder="Heart Rate (BPM)"
                value={vitalSigns.heartRate}
                onChange={(e) => setVitalSigns({...vitalSigns, heartRate: e.target.value})}
              />
            </div>
            <Input
              placeholder="Blood Pressure (120/80)"
              value={vitalSigns.bloodPressure}
              onChange={(e) => setVitalSigns({...vitalSigns, bloodPressure: e.target.value})}
            />
            <Input
              placeholder="Temperature (°F)"
              value={vitalSigns.temperature}
              onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
            />
            <Input
              placeholder="Oxygen Saturation (%)"
              value={vitalSigns.oxygenSaturation}
              onChange={(e) => setVitalSigns({...vitalSigns, oxygenSaturation: e.target.value})}
            />
          </div>
          
          <Textarea
            placeholder="Clinical notes"
            value={vitalSigns.notes}
            onChange={(e) => setVitalSigns({...vitalSigns, notes: e.target.value})}
          />
          
          <Button 
            onClick={handleVitalSignsSubmit}
            className="w-full"
            disabled={vitalSignsMutation.isPending}
          >
            {vitalSignsMutation.isPending ? "Recording..." : "Save to Medical Record"}
          </Button>
        </CardContent>
      </Card>

      {/* Real Patient Data Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Your Active Patients ({patients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {patients.map((patient: any) => (
              <div key={patient.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                  <p className="text-sm text-muted-foreground">{patient.email}</p>
                </div>
                <Badge variant="outline">Active Patient</Badge>
              </div>
            ))}
            {patients.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No active patients found. Patients will appear here when they book appointments.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}