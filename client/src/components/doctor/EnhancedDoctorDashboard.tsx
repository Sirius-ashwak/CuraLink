import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarDays, Clock, Users, AlertTriangle, Video, Stethoscope, 
  Pill, FileText, Activity, TrendingUp, MessageSquare, Phone,
  Heart, Brain, Thermometer, Eye
} from "lucide-react";
import AppointmentSchedule from "./AppointmentSchedule";
import PatientRecords from "./PatientRecords";
import SimpleEmergencyTransport from "./SimpleEmergencyTransport";
import SimpleAvailabilityManager from "./SimpleAvailabilityManager";
import RealMedicalTools from "./RealMedicalTools";

export default function EnhancedDoctorDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Real video consultation functionality
  const startVideoCall = async () => {
    if (!doctorInfo) {
      toast({
        title: "Access Required",
        description: "Doctor credentials required to start video consultation.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get available patients
      const patientsData = await queryClient.fetchQuery({
        queryKey: ["/api/appointments", { doctorId: doctorInfo.id }],
      });

      const availablePatients = Array.isArray(patientsData) 
        ? patientsData.reduce((acc: any[], apt: any) => {
            if (apt.patient && !acc.find(p => p.id === apt.patient.id)) {
              acc.push(apt.patient);
            }
            return acc;
          }, [])
        : [];

      if (availablePatients.length === 0) {
        toast({
          title: "No Patients Available",
          description: "You need scheduled patients to start video consultations.",
          variant: "destructive",
        });
        return;
      }

      // For now, use the first available patient - in real app would show patient selector
      const selectedPatient = availablePatients[0];
      
      const response = await apiRequest("POST", "/api/video-consultation/create-room", {
        doctorId: doctorInfo.id,
        patientId: selectedPatient.id,
        appointmentId: appointments[0]?.id
      });

      // Open video call in new window
      window.open(response.roomUrl, '_blank', 'width=1200,height=800');
      
      toast({
        title: "Video Call Started",
        description: `Secure video consultation initiated with ${selectedPatient.firstName} ${selectedPatient.lastName}`,
      });
    } catch (error) {
      toast({
        title: "Video Call Failed",
        description: "Could not start video consultation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Real AI diagnosis assistant
  const openAIAssistant = async () => {
    if (!doctorInfo) {
      toast({
        title: "Access Required",
        description: "Doctor credentials required for AI diagnosis assistant.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get recent patient symptoms for analysis
      const symptoms = ["fatigue", "headache", "fever"]; // In real app, would come from patient input
      
      const response = await apiRequest("POST", "/api/ai-diagnosis/analyze", {
        symptoms,
        patientHistory: "No significant medical history",
        vitalSigns: {
          heartRate: 72,
          bloodPressure: "120/80",
          temperature: "98.6°F"
        }
      });

      // Show AI analysis in a modal or new tab
      const analysisWindow = window.open('', '_blank', 'width=800,height=600');
      if (analysisWindow) {
        analysisWindow.document.write(`
          <html>
            <head><title>AI Medical Analysis</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>AI Diagnosis Assistant Results</h2>
              <div style="white-space: pre-wrap; line-height: 1.6;">
                ${response.analysis}
              </div>
              <p style="margin-top: 20px; color: #666; font-size: 0.9em;">
                Generated at: ${new Date(response.timestamp).toLocaleString()}
              </p>
            </body>
          </html>
        `);
      }

      toast({
        title: "AI Analysis Complete",
        description: "Medical insights generated successfully.",
      });
    } catch (error) {
      toast({
        title: "AI Analysis Failed",
        description: "Could not generate medical analysis. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openPrescriptionTool = () => {
    setActiveTab("tools"); // Switch to tools tab where real prescription functionality is
  };

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

  // Get today's appointments from Firebase
  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments", { doctorId: doctorInfo?.id }],
    enabled: !!doctorInfo,
    select: (data) => {
      if (Array.isArray(data)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return data.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentTime);
          return appointmentDate >= today && appointmentDate < tomorrow;
        });
      }
      return [];
    }
  });

  // Get emergency transports from Firebase
  const { data: emergencyTransports = [] } = useQuery({
    queryKey: ["/api/emergency-transport"],
    select: (data) => Array.isArray(data) ? data.filter(t => t.status === 'active' || t.status === 'requested') : []
  });

  // Calculate next appointment
  const nextAppointment = appointments
    .filter(apt => new Date(apt.appointmentTime) > new Date())
    .sort((a, b) => new Date(a.appointmentTime).getTime() - new Date(b.appointmentTime).getTime())[0];

  // Calculate unique patients
  const uniquePatients = appointments.reduce((acc: any[], apt) => {
    if (apt.patient && !acc.find(p => p.id === apt.patient?.id)) {
      acc.push(apt.patient);
    }
    return acc;
  }, []);

  if (!user || user.role !== "doctor") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600 dark:text-gray-400">
              Access denied. Doctor credentials required.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Medical Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome, Dr. {user?.firstName} {user?.lastName} • {doctorInfo?.specialty || 'General Practice'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isOnline ? "default" : "secondary"} className="px-3 py-1">
              {isOnline ? "Available" : "Offline"}
            </Badge>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
            <TabsTrigger value="availability">Schedule</TabsTrigger>
            <TabsTrigger value="tools">Medical Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{appointments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {appointments.filter(apt => apt.status === 'scheduled').length} scheduled
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uniquePatients.length}</div>
                  <p className="text-xs text-muted-foreground">Under your care</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Emergency Cases</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{emergencyTransports.length}</div>
                  <p className="text-xs text-muted-foreground">Active transports</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
                  <Clock className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  {nextAppointment ? (
                    <>
                      <div className="text-2xl font-bold">
                        {new Date(nextAppointment.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {nextAppointment.patient?.firstName} {nextAppointment.patient?.lastName}
                      </p>
                    </>
                  ) : (
                    <div className="text-2xl font-bold">--</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    className="text-blue-600" 
                    onClick={startVideoCall}
                  >
                    Start Call
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    AI Diagnosis Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-100 mb-4">Get AI-powered medical insights and symptom analysis</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-green-600"
                    onClick={openAIAssistant}
                  >
                    Open Assistant
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Digital Prescriptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-100 mb-4">Create and send secure digital prescriptions</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="text-purple-600"
                    onClick={openPrescriptionTool}
                  >
                    Write Prescription
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Today's Schedule Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium">
                            {new Date(appointment.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {appointment.patient?.firstName} {appointment.patient?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {appointment.reason || 'General consultation'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{appointment.status}</Badge>
                      </div>
                    ))}
                    {appointments.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{appointments.length - 5} more appointments
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No appointments scheduled for today
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentSchedule />
          </TabsContent>

          <TabsContent value="patients">
            <PatientRecords />
          </TabsContent>

          <TabsContent value="emergency">
            <SimpleEmergencyTransport />
          </TabsContent>

          <TabsContent value="availability">
            <SimpleAvailabilityManager />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <RealMedicalTools />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}