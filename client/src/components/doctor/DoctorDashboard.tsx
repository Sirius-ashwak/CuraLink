import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useWebSocket } from "@/context/WebSocketContext";
import AppointmentSchedule from "./AppointmentSchedule";
import AvailabilityManager from "./AvailabilityManager";
import PatientRecords from "./PatientRecords";
import EmergencyTransportDashboard from "../emergencyTransport/EmergencyTransportDashboard";
import OfflineIndicator from "../notifications/OfflineIndicator";
import NotificationToast from "../notifications/NotificationToast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, Clock, Ambulance } from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { sendMessage, lastMessage } = useWebSocket();
  const [activeTab, setActiveTab] = useState("schedule");
  const [isOnline, setIsOnline] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState({ title: "", message: "" });
  
  // Get the tab from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const tab = params.get("tab");
    if (tab === "availability") setActiveTab("availability");
    if (tab === "patients") setActiveTab("patients");
    if (tab === "emergency-transport") setActiveTab("emergency-transport");
  }, [location]);
  
  // Get doctor info
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
  
  // Get upcoming appointments for today
  const { data: appointments = [] } = useQuery({
    queryKey: ["/api/appointments"],
    select: (data) => {
      if (doctorInfo && Array.isArray(data)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return data.filter((appointment) => {
          const appointmentDate = new Date(appointment.date);
          appointmentDate.setHours(0, 0, 0, 0);
          return (
            appointmentDate.getTime() === today.getTime() &&
            appointment.status !== "canceled"
          );
        });
      }
      return [];
    },
    enabled: !!doctorInfo,
  });
  
  // Get the next appointment
  const nextAppointment = appointments.length > 0 
    ? appointments.sort((a, b) => {
        const timeA = a.startTime;
        const timeB = b.startTime;
        return timeA.localeCompare(timeB);
      })[0] 
    : null;
    
  // Get active emergency transports
  const { data: emergencyTransports = [] } = useQuery({
    queryKey: ["/api/emergency-transport"],
    select: (data) => {
      if (Array.isArray(data)) {
        return data.filter((transport) => 
          transport.status === "requested" || transport.status === "assigned"
        );
      }
      return [];
    },
  });
  
  const toggleAvailability = async () => {
    if (!doctorInfo) return;
    
    try {
      await apiRequest("PATCH", `/api/doctors/${doctorInfo.id}`, {
        isAvailable: !isOnline
      });
      
      setIsOnline(!isOnline);
      
      // Send WebSocket message to notify clients
      sendMessage({
        type: "updateDoctorStatus",
        isAvailable: !isOnline
      });
      
      setNotification({
        title: !isOnline ? "You're Online" : "You're Offline",
        message: !isOnline 
          ? "Patients can now book appointments with you." 
          : "You're now appearing offline to patients."
      });
      setShowNotification(true);
    } catch (error) {
      console.error("Failed to update availability", error);
    }
  };
  
  useEffect(() => {
    if (doctorInfo) {
      setIsOnline(doctorInfo.isAvailable);
    }
  }, [doctorInfo]);
  
  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage?.data) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        if (data.type === "newEmergencyTransport") {
          // Show notification for new emergency transport request
          setNotification({
            title: "New Emergency Transport Request",
            message: `A patient needs urgent medical transport from ${data.location}`,
          });
          setShowNotification(true);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }
  }, [lastMessage]);
  
  if (!user || user.role !== "doctor") return null;
  
  return (
    <div className="relative min-h-screen">
      {/* Background patterns for visual interest */}
      <div className="absolute inset-0 bg-dots-darker opacity-5 pointer-events-none"></div>
      
      {/* Page content with proper top spacing for fixed header */}
      <div className="relative z-10">
        {/* Welcome & Stats */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600/5 via-blue-600/10 to-blue-800/5 rounded-xl p-8 mb-8 border border-blue-800/10 shadow-xl">
            <div className="flex items-start">
              <div className="mr-4 p-3 bg-blue-500/10 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M9 14l2 2 4-4"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-blue-100 mb-1">Welcome, Dr. {user.lastName}</h2>
                <p className="text-blue-300/70 text-lg">Healthcare Provider Dashboard</p>
                <p className="text-blue-400/60 text-sm mt-2">Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 mt-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Today's Schedule Card */}
            <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-blue-900/10 group">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 tracking-wider uppercase">Today's Schedule</h3>
              <div className="flex items-center space-x-4 mt-4">
                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                  <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-3xl font-medium text-gray-800 dark:text-white">{appointments.length}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Appointments today</p>
                </div>
              </div>
            </div>
          
            {/* Next Appointment Card */}
            <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-indigo-900/10 group">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 tracking-wider uppercase">Next Appointment</h3>
              {nextAppointment ? (
                <div className="flex items-center space-x-4 mt-4">
                  <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-lg">
                    <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-medium text-gray-800 dark:text-white">{nextAppointment.startTime}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                      {nextAppointment.patient.firstName} {nextAppointment.patient.lastName}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4 mt-4">
                  <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    <Clock className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-800 dark:text-white">No appointments</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Your schedule is clear</p>
                  </div>
                </div>
              )}
            </div>
          
            {/* Availability Status Card */}
            <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-all hover:shadow-cyan-900/10 group">
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all"></div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 tracking-wider uppercase">Status</h3>
              <div className="flex items-center space-x-4 mt-4">
                <div className={`p-3 rounded-lg ${isOnline ? 'bg-green-500/10 dark:bg-green-500/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <div className={`h-6 w-6 flex items-center justify-center ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className={`text-xl font-medium ${isOnline ? 'text-gray-800 dark:text-white' : 'text-gray-700 dark:text-gray-400'}`}>
                    {isOnline ? 'Available' : 'Offline'}
                  </p>
                  <button 
                    onClick={toggleAvailability}
                    className={`text-sm mt-1 rounded-full px-3 py-1 inline-flex items-center 
                      ${isOnline 
                        ? 'text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20' 
                        : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                      } transition-colors`}
                  >
                    {isOnline ? 'Go Offline' : 'Go Online'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          
            {/* Emergency Requests Card */}
            <div 
              className={`relative overflow-hidden rounded-xl shadow-xl border p-6 cursor-pointer transition-all
                ${emergencyTransports.length > 0 
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-red-900/10' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-gray-500/10'
                } group`
              }
              onClick={() => setActiveTab("emergency-transport")}
            >
              <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full blur-xl transition-all
                ${emergencyTransports.length > 0 
                  ? 'bg-red-500/10 group-hover:bg-red-500/20' 
                  : 'bg-gray-500/10 group-hover:bg-gray-500/20'
                }`}
              ></div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 tracking-wider uppercase">Emergency Requests</h3>
              <div className="flex items-center space-x-4 mt-4">
                <div className={`p-3 rounded-lg 
                  ${emergencyTransports.length > 0 
                    ? 'bg-red-500/10 dark:bg-red-500/20' 
                    : 'bg-gray-200 dark:bg-gray-700'
                  }`
                }>
                  <Ambulance className={`h-6 w-6 
                    ${emergencyTransports.length > 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-500 dark:text-gray-400'
                    }`
                  } />
                </div>
                <div>
                  <p className={`text-3xl font-medium 
                    ${emergencyTransports.length > 0 
                      ? 'text-gray-800 dark:text-white' 
                      : 'text-gray-700 dark:text-gray-300'
                    }`
                  }>
                    {emergencyTransports.length}
                  </p>
                  <p className={`text-sm 
                    ${emergencyTransports.length > 0 
                      ? 'text-red-600 dark:text-red-400 font-medium' 
                      : 'text-gray-500 dark:text-gray-400'
                    }`
                  }>
                    {emergencyTransports.length > 0 
                      ? 'Active urgent requests' 
                      : 'No active requests'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        {/* Doctor Tabs - Professional style */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200 dark:border-gray-700">
              <TabsList className="w-full rounded-none p-0 h-auto flex overflow-x-auto bg-transparent">
                <TabsTrigger 
                  value="schedule"
                  className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 rounded-none whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  Today's Schedule
                </TabsTrigger>
                <TabsTrigger 
                  value="availability" 
                  className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 rounded-none whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  Availability
                </TabsTrigger>
                <TabsTrigger 
                  value="patients" 
                  className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 rounded-none whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  Patient Records
                </TabsTrigger>
                <TabsTrigger 
                  value="emergency-transport" 
                  className="py-4 px-6 text-sm font-medium text-gray-700 dark:text-gray-300 border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-400 rounded-none whitespace-nowrap flex-shrink-0 transition-colors"
                >
                  <div className="flex items-center">
                    <Ambulance className="h-4 w-4 mr-2 text-red-500" />
                    Emergency Transport
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6">
              <TabsContent value="schedule" className="mt-0">
                <AppointmentSchedule />
              </TabsContent>
              
              <TabsContent value="availability" className="mt-0">
                <AvailabilityManager />
              </TabsContent>
              
              <TabsContent value="patients" className="mt-0">
                <PatientRecords />
              </TabsContent>
              
              <TabsContent value="emergency-transport" className="mt-0">
                <EmergencyTransportDashboard />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      
      {/* Notifications */}
      <OfflineIndicator />
      {showNotification && (
        <NotificationToast 
          title={notification.title}
          message={notification.message}
          onClose={() => setShowNotification(false)}
          type={notification.title.includes("Emergency") ? "destructive" : 
                notification.title.includes("Appointment") ? "success" : 
                isOnline ? "default" : "warning"}
        />
      )}
    </div>
  );
}
