import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { useLocation } from "wouter";
import { useWebSocket } from "@/context/WebSocketContext";
import AppointmentCard from "./AppointmentCard";
import AppointmentBooking from "./AppointmentBooking";
import OfflineIndicator from "../notifications/OfflineIndicator";
import NotificationToast from "../notifications/NotificationToast";
import SymptomChecker from "../chatbot/SymptomChecker";
import DoctorMatcher from "../telehealth/DoctorMatcher";
import MedicineTracker from "../medicines/MedicineTracker";
import EmergencyTransportForm from "../emergencyTransport/EmergencyTransportForm";
import EmergencyTransportList from "../emergencyTransport/EmergencyTransportList";
import SideNavigation from "../layout/SideNavigation";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Video, Bot, Pill, UserSearch, Ambulance } from "lucide-react";
import { AppointmentWithUsers } from "@shared/schema";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { appointments, isLoading } = useAppointments();
  const { lastMessage } = useWebSocket();
  const [, setLocation] = useLocation();
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
  
  // Handle WebSocket messages for real-time notifications
  useEffect(() => {
    if (lastMessage?.data) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        // Handle different types of WebSocket messages
        if (data.type === "emergencyTransportsUpdate" || data.type === "emergencyTransports") {
          // Show notification for emergency transport status updates if needed
          if (data.data && data.data.length > 0) {
            const latestTransport = data.data[data.data.length - 1];
            
            // Set notification based on transport status
            if (latestTransport.status === "assigned") {
              setNotification({
                title: "Emergency Transport Update",
                message: `A driver has been assigned to your emergency transport request and will arrive at ${new Date(latestTransport.estimatedArrival).toLocaleTimeString()}.`,
              });
              setShowNotification(true);
              // Automatically navigate to the emergency transport tab
              setActiveTab("emergency-transport");
            } else if (latestTransport.status === "in_progress") {
              setNotification({
                title: "Emergency Transport In Progress",
                message: "Your driver is on the way to the hospital with you.",
              });
              setShowNotification(true);
            } else if (latestTransport.status === "completed") {
              setNotification({
                title: "Emergency Transport Completed",
                message: "Your emergency transport has been completed. We hope you're feeling better!",
              });
              setShowNotification(true);
            }
          }
        } else if (data.type === "appointments") {
          // Handle appointment updates
          if (data.data && data.data.length > 0) {
            const todayAppointments = data.data.filter((appointment: AppointmentWithUsers) => {
              const appointmentDate = new Date(appointment.date);
              const today = new Date();
              return (
                appointmentDate.getDate() === today.getDate() &&
                appointmentDate.getMonth() === today.getMonth() &&
                appointmentDate.getFullYear() === today.getFullYear()
              );
            });
            
            if (todayAppointments.length > 0 && !showNotification) {
              setNotification({
                title: "Upcoming Appointment Today",
                message: "You have an appointment scheduled for today. Please be available at the scheduled time.",
              });
              setShowNotification(true);
            }
          }
        } else if (data.type === "doctorUpdate") {
          // A doctor's status has been updated (online/offline)
          setNotification({
            title: "Doctor Status Updated",
            message: `A doctor's availability has changed. They are now ${data.data.isAvailable ? 'online' : 'offline'}.`,
          });
          setShowNotification(true);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }
  }, [lastMessage, showNotification]);
  
  // Listen for tab change events from the bottom navigation
  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.tabName) {
        setActiveTab(customEvent.detail.tabName);
      }
    };
    
    window.addEventListener('tabChange', handleTabChange as EventListener);
    
    // Check if we have a hash in the URL to activate specific tab on direct load
    const hash = window.location.hash;
    if (hash === '#book-appointment') {
      setActiveTab('appointments');
    } else if (hash.includes('upcoming-appointments')) {
      // Just scroll to the section but keep the dashboard tab
      setTimeout(() => {
        const element = document.getElementById("upcoming-appointments");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
    
    return () => {
      window.removeEventListener('tabChange', handleTabChange as EventListener);
    };
  }, []);
  
  if (!user) return null;
  
  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Side Navigation */}
      <SideNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content Area with proper padding for the side nav and top header */}
      <div className="flex-1 p-6 ml-0 md:ml-64 mt-16">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-xl font-medium text-white">Welcome back, {user.firstName}</h2>
          <p className="text-gray-400">How can we help you today?</p>
        </div>
        
        {/* Main Content Using Tabs but without the visible TabsList */}
        <Tabs value={activeTab} className="mb-8" onValueChange={setActiveTab}>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-white font-medium mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              <a onClick={() => setActiveTab("appointments")} className="flex flex-col items-center p-4 rounded-lg bg-gray-900 shadow-sm hover:bg-gray-800 transition-colors cursor-pointer border border-gray-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                  <CalendarDays className="h-6 w-6 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white">Book Appointment</span>
              </a>
              <a onClick={() => setActiveTab("ai-chat")} className="flex flex-col items-center p-4 rounded-lg bg-gray-900 shadow-sm hover:bg-gray-800 transition-colors cursor-pointer border border-gray-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                  <Bot className="h-6 w-6 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white">AI Health Chat</span>
              </a>
              <a onClick={() => setActiveTab("medicine-tracker")} className="flex flex-col items-center p-4 rounded-lg bg-gray-900 shadow-sm hover:bg-gray-800 transition-colors cursor-pointer border border-gray-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <Pill className="h-6 w-6 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white">Medicine Tracker</span>
              </a>
              <a onClick={() => setActiveTab("doctor-matcher")} className="flex flex-col items-center p-4 rounded-lg bg-gray-900 shadow-sm hover:bg-gray-800 transition-colors cursor-pointer border border-gray-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                  <UserSearch className="h-6 w-6 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white">Find Doctor</span>
              </a>
              <a onClick={() => setLocation("/video-call")} className="flex flex-col items-center p-4 rounded-lg bg-gray-900 shadow-sm hover:bg-gray-800 transition-colors cursor-pointer border border-gray-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(79,70,229,0.5)]">
                  <Video className="h-6 w-6 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white">Video Consult</span>
              </a>
              <a onClick={() => setActiveTab("emergency-transport")} className="flex flex-col items-center p-4 rounded-lg bg-gray-900 shadow-sm hover:bg-gray-800 transition-colors cursor-pointer border border-gray-800">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                  <Ambulance className="h-6 w-6 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white">Emergency Transport</span>
              </a>
            </div>
          </div>
          
          {/* Upcoming Appointments */}
          <section id="upcoming-appointments" className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Upcoming Appointments</h3>
              <a onClick={() => setActiveTab("appointments")} className="text-blue-500 text-sm cursor-pointer hover:text-blue-400">View all</a>
            </div>
            
            {isLoading ? (
              <LoadingScreen 
                type="minimal" 
                variant="appointment" 
                message="Loading your appointments" 
                showMascot={true} 
                className="py-6"
              />
            ) : appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg shadow-sm p-6 text-center border border-gray-800">
                <p className="text-gray-400">You don't have any upcoming appointments.</p>
                <a onClick={() => setActiveTab("appointments")} className="text-blue-500 font-medium mt-2 inline-block cursor-pointer hover:text-blue-400">
                  Book your first appointment
                </a>
              </div>
            )}
          </section>
          
          {/* Health Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gray-900 border border-gray-800">
              <CardHeader className="bg-blue-900 bg-opacity-30 pb-2 border-b border-gray-800">
                <CardTitle className="text-base flex items-center text-white">
                  <Bot className="h-4 w-4 mr-2 text-blue-500" />
                  AI Health Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-400 mb-3">Get instant answers to your health questions and symptoms from our AI companion.</p>
                <a onClick={() => setActiveTab("ai-chat")} className="text-blue-500 text-sm font-medium cursor-pointer hover:text-blue-400">Chat with AI Assistant →</a>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border border-gray-800">
              <CardHeader className="bg-blue-800 bg-opacity-30 pb-2 border-b border-gray-800">
                <CardTitle className="text-base flex items-center text-white">
                  <UserSearch className="h-4 w-4 mr-2 text-blue-500" />
                  Find the Right Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-400 mb-3">Answer a few questions about your symptoms to find doctors who specialize in your needs.</p>
                <a onClick={() => setActiveTab("doctor-matcher")} className="text-blue-500 text-sm font-medium cursor-pointer hover:text-blue-400">Find Matching Doctors →</a>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border border-gray-800">
              <CardHeader className="bg-blue-700 bg-opacity-30 pb-2 border-b border-gray-800">
                <CardTitle className="text-base flex items-center text-white">
                  <Pill className="h-4 w-4 mr-2 text-blue-500" />
                  Medicine Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-400 mb-3">Keep track of your medications, get reminders, and learn more about your prescriptions.</p>
                <a onClick={() => setActiveTab("medicine-tracker")} className="text-blue-500 text-sm font-medium cursor-pointer hover:text-blue-400">Manage Medicines →</a>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border border-gray-800">
              <CardHeader className="bg-red-900 bg-opacity-30 pb-2 border-b border-gray-800">
                <CardTitle className="text-base flex items-center text-white">
                  <Ambulance className="h-4 w-4 mr-2 text-red-500" />
                  Emergency Transport
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-400 mb-3">Request emergency medical transport if you're in a rural area and need immediate assistance.</p>
                <a onClick={() => setActiveTab("emergency-transport")} className="text-red-500 text-sm font-medium cursor-pointer hover:text-red-400">Request Transport →</a>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* AI Companion Chat Tab */}
        <TabsContent value="ai-chat">
          <Card className="mb-4 bg-gray-900 border border-gray-800">
            <CardHeader className="bg-blue-900 bg-opacity-30 border-b border-gray-800">
              <CardTitle className="flex items-center text-white">
                <Bot className="w-5 h-5 mr-2 text-blue-500" />
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
          <Card className="mb-4 bg-gray-900 border border-gray-800">
            <CardHeader className="bg-blue-700 bg-opacity-30 border-b border-gray-800">
              <CardTitle className="flex items-center text-white">
                <Pill className="w-5 h-5 mr-2 text-blue-500" />
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
          <Card className="mb-4 bg-gray-900 border border-gray-800">
            <CardHeader className="bg-blue-800 bg-opacity-30 border-b border-gray-800">
              <CardTitle className="flex items-center text-white">
                <UserSearch className="w-5 h-5 mr-2 text-blue-500" />
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
          <Card className="mb-4 bg-gray-900 border border-gray-800">
            <CardHeader className="bg-blue-600 bg-opacity-30 border-b border-gray-800">
              <CardTitle className="flex items-center text-white">
                <CalendarDays className="w-5 h-5 mr-2 text-blue-500" />
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
        
        {/* Emergency Transport Tab */}
        <TabsContent value="emergency-transport">
          <Card className="mb-4 bg-gray-900 border border-gray-800">
            <CardHeader className="bg-red-900 bg-opacity-30 border-b border-gray-800">
              <CardTitle className="flex items-center text-white">
                <Ambulance className="w-5 h-5 mr-2 text-red-500" />
                Emergency Transport
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[600px] overflow-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <EmergencyTransportForm />
                  </div>
                  <div>
                    <EmergencyTransportList />
                  </div>
                </div>
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
          type={notification.title.includes("Emergency") ? "destructive" : 
                notification.title.includes("Appointment") ? "success" :
                notification.title.includes("Medicine") ? "warning" :
                "default"}
        />
      )}
      </div>
    </div>
  );
}
