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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-gray-900 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-[80px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-[80px] opacity-20 pointer-events-none"></div>
      {/* Side Navigation */}
      <SideNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content Area with proper padding for top header */}
      <div className="p-6 mt-16">
        {/* Welcome Section with enhanced styling */}
        <div className="mb-10 relative">
          {/* Background glow effect */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-600/20 rounded-full filter blur-3xl opacity-70 pointer-events-none"></div>
          
          <h2 className="text-3xl font-semibold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-blue-200">
            Welcome back, {user.firstName}
          </h2>
          <p className="text-indigo-300/80 mt-2 text-lg max-w-xl leading-relaxed">
            How can we help you today? Your health is our top priority.
          </p>
        </div>
        
        {/* Main Content Using Tabs but without the visible TabsList */}
        <Tabs value={activeTab} className="mb-8" onValueChange={setActiveTab}>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          {/* Quick Actions */}
          <div className="mb-10">
            <h3 className="flex items-center mb-5 text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-blue-200">
              <span className="inline-block mr-3 p-1.5 rounded-lg bg-indigo-900/30 border border-indigo-700/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <CalendarDays className="w-5 h-5 text-indigo-400" />
              </span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
              <a onClick={() => setActiveTab("appointments")} className="group flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-blue-900/20 cursor-pointer border border-gray-800/50 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all duration-300 transform group-hover:scale-110">
                  <CalendarDays className="h-7 w-7 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white group-hover:text-blue-300 transition-colors duration-300">Book Appointment</span>
              </a>
              <a onClick={() => setActiveTab("ai-chat")} className="group flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-purple-900/20 cursor-pointer border border-gray-800/50 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(124,58,237,0.5)] group-hover:shadow-[0_0_25px_rgba(124,58,237,0.6)] transition-all duration-300 transform group-hover:scale-110">
                  <Bot className="h-7 w-7 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white group-hover:text-purple-300 transition-colors duration-300">AI Health Chat</span>
              </a>
              <a onClick={() => setActiveTab("medicine-tracker")} className="group flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-green-900/20 cursor-pointer border border-gray-800/50 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all duration-300 transform group-hover:scale-110">
                  <Pill className="h-7 w-7 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white group-hover:text-green-300 transition-colors duration-300">Medicine Tracker</span>
              </a>
              <a onClick={() => setActiveTab("doctor-matcher")} className="group flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-sky-900/20 cursor-pointer border border-gray-800/50 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(14,165,233,0.5)] group-hover:shadow-[0_0_25px_rgba(14,165,233,0.6)] transition-all duration-300 transform group-hover:scale-110">
                  <UserSearch className="h-7 w-7 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white group-hover:text-sky-300 transition-colors duration-300">Find Doctor</span>
              </a>
              <a onClick={() => setLocation("/video-call")} className="group flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-indigo-900/20 cursor-pointer border border-gray-800/50 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(79,70,229,0.5)] group-hover:shadow-[0_0_25px_rgba(79,70,229,0.6)] transition-all duration-300 transform group-hover:scale-110">
                  <Video className="h-7 w-7 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white group-hover:text-indigo-300 transition-colors duration-300">Video Consult</span>
              </a>
              <a onClick={() => setActiveTab("emergency-transport")} className="group flex flex-col items-center p-6 rounded-xl bg-gradient-to-b from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-rose-900/20 cursor-pointer border border-gray-800/50 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(244,63,94,0.5)] group-hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] transition-all duration-300 transform group-hover:scale-110">
                  <Ambulance className="h-7 w-7 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="text-sm font-medium text-center text-white group-hover:text-rose-300 transition-colors duration-300">Emergency Transport</span>
              </a>
            </div>
          </div>
          
          {/* Upcoming Appointments with enhanced styling */}
          <section id="upcoming-appointments" className="mb-10">
            <div className="flex justify-between items-center mb-5">
              <h3 className="flex items-center text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-blue-200">
                <span className="inline-block mr-3 p-1.5 rounded-lg bg-indigo-900/30 border border-indigo-700/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                  <CalendarDays className="w-5 h-5 text-indigo-400" />
                </span>
                Upcoming Appointments
              </h3>
              <a 
                onClick={() => setActiveTab("appointments")} 
                className="text-indigo-400 text-sm cursor-pointer hover:text-indigo-300 transition-colors flex items-center gap-2 group px-3 py-1.5 rounded-full border border-indigo-900/40 hover:border-indigo-700/40 hover:bg-indigo-900/20"
              >
                View all <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
              </a>
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
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 rounded-xl shadow-xl p-8 text-center border border-indigo-900/30 relative overflow-hidden backdrop-blur-sm">
                {/* Background glow effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
                
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400/20 to-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 relative shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  <CalendarDays className="h-9 w-9 text-indigo-300 opacity-90" />
                </div>
                <p className="text-indigo-300/80 mb-5 text-lg">You don't have any upcoming appointments.</p>
                <a 
                  onClick={() => setActiveTab("appointments")} 
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full 
                    bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600
                    text-white font-medium text-sm transition-all duration-300 cursor-pointer shadow-md
                    hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transform hover:-translate-y-0.5"
                >
                  Book your first appointment
                </a>
              </div>
            )}
          </section>
          
          {/* Health Overview Cards with enhanced styling */}
          <div className="mb-12">
            <h3 className="flex items-center mb-5 text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-blue-200">
              <span className="inline-block mr-3 p-1.5 rounded-lg bg-indigo-900/30 border border-indigo-700/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <Bot className="w-5 h-5 text-indigo-400" />
              </span>
              Health Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="group bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-800/50 shadow-lg hover:shadow-blue-900/20 transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-900/40 via-blue-800/30 to-blue-900/40 pb-3 border-b border-blue-900/30 transition-all duration-300">
                  <CardTitle className="text-base flex items-center text-white">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] transition-all duration-300">
                      <Bot className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-blue-300 group-hover:from-blue-50 group-hover:to-blue-200 transition-all duration-300">AI Health Assistant</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-300 mb-4 leading-relaxed">Get instant answers to your health questions and symptoms from our AI companion.</p>
                  <a onClick={() => setActiveTab("ai-chat")} className="inline-flex items-center text-blue-400 text-sm font-medium cursor-pointer hover:text-blue-300 transition-colors duration-300 group-hover:translate-x-1 transform transition-transform">
                    Chat with AI Assistant <span className="ml-1 text-xs">→</span>
                  </a>
                </CardContent>
              </Card>
              
              <Card className="group bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-800/50 shadow-lg hover:shadow-purple-900/20 transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-purple-900/40 pb-3 border-b border-purple-900/30 transition-all duration-300">
                  <CardTitle className="text-base flex items-center text-white">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(124,58,237,0.5)] group-hover:shadow-[0_0_20px_rgba(124,58,237,0.6)] transition-all duration-300">
                      <UserSearch className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-100 to-purple-300 group-hover:from-purple-50 group-hover:to-purple-200 transition-all duration-300">Find the Right Doctor</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-300 mb-4 leading-relaxed">Answer a few questions about your symptoms to find doctors who specialize in your needs.</p>
                  <a onClick={() => setActiveTab("doctor-matcher")} className="inline-flex items-center text-purple-400 text-sm font-medium cursor-pointer hover:text-purple-300 transition-colors duration-300 group-hover:translate-x-1 transform transition-transform">
                    Find Matching Doctors <span className="ml-1 text-xs">→</span>
                  </a>
                </CardContent>
              </Card>
              
              <Card className="group bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-800/50 shadow-lg hover:shadow-green-900/20 transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-900/40 via-green-800/30 to-green-900/40 pb-3 border-b border-green-900/30 transition-all duration-300">
                  <CardTitle className="text-base flex items-center text-white">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(16,185,129,0.5)] group-hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all duration-300">
                      <Pill className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-100 to-green-300 group-hover:from-green-50 group-hover:to-green-200 transition-all duration-300">Medicine Tracker</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-300 mb-4 leading-relaxed">Keep track of your medications, get reminders, and learn more about your prescriptions.</p>
                  <a onClick={() => setActiveTab("medicine-tracker")} className="inline-flex items-center text-green-400 text-sm font-medium cursor-pointer hover:text-green-300 transition-colors duration-300 group-hover:translate-x-1 transform transition-transform">
                    Manage Medicines <span className="ml-1 text-xs">→</span>
                  </a>
                </CardContent>
              </Card>
              
              <Card className="group bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-800/50 shadow-lg hover:shadow-rose-900/20 transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-rose-900/40 via-rose-800/30 to-rose-900/40 pb-3 border-b border-rose-900/30 transition-all duration-300">
                  <CardTitle className="text-base flex items-center text-white">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(244,63,94,0.5)] group-hover:shadow-[0_0_20px_rgba(244,63,94,0.6)] transition-all duration-300">
                      <Ambulance className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-100 to-rose-300 group-hover:from-rose-50 group-hover:to-rose-200 transition-all duration-300">Emergency Transport</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-gray-300 mb-4 leading-relaxed">Request emergency medical transport if you're in a rural area and need immediate assistance.</p>
                  <a onClick={() => setActiveTab("emergency-transport")} className="inline-flex items-center text-rose-400 text-sm font-medium cursor-pointer hover:text-rose-300 transition-colors duration-300 group-hover:translate-x-1 transform transition-transform">
                    Request Transport <span className="ml-1 text-xs">→</span>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* AI Companion Chat Tab */}
        <TabsContent value="ai-chat">
          <Card className="mb-4 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border border-indigo-900/30 shadow-2xl overflow-hidden relative">
            {/* Background glow effect */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
            
            <CardHeader className="bg-gradient-to-r from-indigo-900/40 via-indigo-800/30 to-indigo-900/40 border-b border-indigo-900/30 relative z-10">
              <CardTitle className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  <Bot className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 to-blue-200 text-lg">AI Health Companion</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div className="h-[650px]">
                <SymptomChecker />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Medicine Tracker Tab */}
        <TabsContent value="medicine-tracker">
          <Card className="mb-4 bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-800/50 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-900/40 via-green-800/30 to-green-900/40 border-b border-green-900/30">
              <CardTitle className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <Pill className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-100 to-green-300">Medicine Tracker</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[650px] overflow-auto">
                <MedicineTracker />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Doctor Matcher Tab */}
        <TabsContent value="doctor-matcher">
          <Card className="mb-4 bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-800/50 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-purple-900/40 border-b border-purple-900/30">
              <CardTitle className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                  <UserSearch className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-100 to-purple-300">Find the Right Doctor</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[650px] overflow-auto">
                <DoctorMatcher />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appointments Tab */}
        <TabsContent value="appointments">
          <Card className="mb-4 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border border-indigo-900/30 shadow-2xl overflow-hidden relative">
            {/* Background glow effect */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
            
            <CardHeader className="bg-gradient-to-r from-indigo-900/40 via-indigo-800/30 to-indigo-900/40 border-b border-indigo-900/30 relative z-10">
              <CardTitle className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  <CalendarDays className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 to-blue-200 text-lg">Schedule an Appointment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative z-10">
              <div id="book-appointment" className="h-[650px] overflow-auto p-6">
                <AppointmentBooking />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Emergency Transport Tab */}
        <TabsContent value="emergency-transport">
          <Card className="mb-4 bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-800/50 shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-rose-900/40 via-rose-800/30 to-rose-900/40 border-b border-rose-900/30">
              <CardTitle className="flex items-center">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                  <Ambulance className="h-5 w-5 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.6)]" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-100 to-rose-300">Emergency Transport</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[650px] overflow-auto p-5">
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
