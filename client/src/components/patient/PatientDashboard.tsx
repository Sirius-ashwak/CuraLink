import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import AppointmentCard from "./AppointmentCard";
import AppointmentBooking from "./AppointmentBooking";
import OfflineIndicator from "../notifications/OfflineIndicator";
import NotificationToast from "../notifications/NotificationToast";
import SymptomChecker from "../chatbot/SymptomChecker";
import DoctorMatcher from "../telehealth/DoctorMatcher";
import MedicineTracker from "../medicines/MedicineTracker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { appointments, isLoading } = useAppointments();
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ title: "", message: "" });
  const [activeTab, setActiveTab] = useState("dashboard");
  
  useEffect(() => {
    // This would come from WebSocket notifications in a real application
    const hasAppointmentsToday = appointments.some(appointment => {
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      return (
        appointmentDate.getDate() === today.getDate() &&
        appointmentDate.getMonth() === today.getMonth() &&
        appointmentDate.getFullYear() === today.getFullYear()
      );
    });
    
    if (hasAppointmentsToday && !showNotification) {
      setNotification({
        title: "Upcoming Appointment Today",
        message: "You have an appointment scheduled for today. Please be available at the scheduled time."
      });
      setShowNotification(true);
    }
  }, [appointments, showNotification]);
  
  if (!user) return null;
  
  return (
    <>
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-xl font-medium text-text-primary">Welcome back, {user.firstName}</h2>
        <p className="text-text-secondary">How can we help you today?</p>
      </div>
      
      {/* Main Tabs Navigation */}
      <Tabs defaultValue="dashboard" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="ai-chat">AI Companion</TabsTrigger>
          <TabsTrigger value="medicine-tracker">Medicine Tracker</TabsTrigger>
          <TabsTrigger value="doctor-matcher">Doctor Matcher</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-5">
            <a onClick={() => setActiveTab("appointments")} className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mb-2">
                <span className="material-icons text-white">calendar_month</span>
              </div>
              <span className="text-sm font-medium text-center">Book Appointment</span>
            </a>
            <a onClick={() => setActiveTab("ai-chat")} className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-secondary-light flex items-center justify-center mb-2">
                <span className="material-icons text-white">smart_toy</span>
              </div>
              <span className="text-sm font-medium text-center">AI Health Chat</span>
            </a>
            <a onClick={() => setActiveTab("medicine-tracker")} className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mb-2">
                <span className="material-icons text-white">medication</span>
              </div>
              <span className="text-sm font-medium text-center">Medicine Tracker</span>
            </a>
            <a onClick={() => setActiveTab("doctor-matcher")} className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mb-2">
                <span className="material-icons text-white">person_search</span>
              </div>
              <span className="text-sm font-medium text-center">Find Doctor</span>
            </a>
            <a href="#" className="flex flex-col items-center p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-neutral-dark flex items-center justify-center mb-2">
                <span className="material-icons text-white">videocam</span>
              </div>
              <span className="text-sm font-medium text-center">Video Consult</span>
            </a>
          </div>
          
          {/* Upcoming Appointments */}
          <section id="upcoming-appointments" className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Upcoming Appointments</h3>
              <a onClick={() => setActiveTab("appointments")} className="text-primary text-sm cursor-pointer">View all</a>
            </div>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-text-secondary">You don't have any upcoming appointments.</p>
                <a onClick={() => setActiveTab("appointments")} className="text-primary font-medium mt-2 inline-block cursor-pointer">
                  Book your first appointment
                </a>
              </div>
            )}
          </section>
          
          {/* Health Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="bg-primary bg-opacity-10 pb-2">
                <CardTitle className="text-base flex items-center">
                  <span className="material-icons mr-2 text-primary text-sm">smart_toy</span>
                  AI Health Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-text-secondary mb-3">Get instant answers to your health questions and symptoms from our AI companion.</p>
                <a onClick={() => setActiveTab("ai-chat")} className="text-primary text-sm font-medium cursor-pointer">Chat with AI Assistant →</a>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="bg-green-100 pb-2">
                <CardTitle className="text-base flex items-center">
                  <span className="material-icons mr-2 text-green-600 text-sm">person_search</span>
                  Find the Right Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-text-secondary mb-3">Answer a few questions about your symptoms to find doctors who specialize in your needs.</p>
                <a onClick={() => setActiveTab("doctor-matcher")} className="text-green-600 text-sm font-medium cursor-pointer">Find Matching Doctors →</a>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="bg-accent bg-opacity-10 pb-2">
                <CardTitle className="text-base flex items-center">
                  <span className="material-icons mr-2 text-accent text-sm">medication</span>
                  Medicine Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-text-secondary mb-3">Keep track of your medications, get reminders, and learn more about your prescriptions.</p>
                <a onClick={() => setActiveTab("medicine-tracker")} className="text-accent text-sm font-medium cursor-pointer">Manage Medicines →</a>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* AI Companion Chat Tab */}
        <TabsContent value="ai-chat">
          <Card className="mb-4">
            <CardHeader className="bg-primary bg-opacity-10">
              <CardTitle className="flex items-center">
                <span className="material-icons mr-2 text-primary">smart_toy</span>
                AI Health Companion
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px]">
                <SymptomChecker />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Medicine Tracker Tab */}
        <TabsContent value="medicine-tracker">
          <Card className="mb-4">
            <CardHeader className="bg-accent bg-opacity-10">
              <CardTitle className="flex items-center">
                <span className="material-icons mr-2 text-accent">medication</span>
                Medicine Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] overflow-auto">
                <MedicineTracker />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Doctor Matcher Tab */}
        <TabsContent value="doctor-matcher">
          <Card className="mb-4">
            <CardHeader className="bg-green-100">
              <CardTitle className="flex items-center">
                <span className="material-icons mr-2 text-green-600">person_search</span>
                Find the Right Doctor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] overflow-auto">
                <DoctorMatcher />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card className="mb-4">
            <CardHeader className="bg-primary bg-opacity-10">
              <CardTitle className="flex items-center">
                <span className="material-icons mr-2 text-primary">calendar_month</span>
                Schedule an Appointment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div id="book-appointment" className="h-[600px] overflow-auto p-4">
                <AppointmentBooking />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Notifications */}
      <OfflineIndicator />
      {showNotification && (
        <NotificationToast 
          title={notification.title}
          message={notification.message}
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  );
}
