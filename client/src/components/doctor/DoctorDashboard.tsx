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
    <>
      {/* Welcome & Stats */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-600/10 to-blue-800/5 rounded-lg p-6 mb-6 border border-blue-800/20">
          <h2 className="text-2xl font-medium text-blue-50">Welcome, Dr. {user.lastName}</h2>
          <p className="text-blue-200/70">Your healthcare dashboard is ready</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 md:grid-cols-4">
          {/* Today's Schedule Card */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/30 rounded-lg shadow-md p-5 border border-blue-700/30 hover:border-blue-600/50 transition-all">
            <h3 className="text-sm font-medium text-blue-200 mb-2">Today's Schedule</h3>
            <div className="flex items-center space-x-3 mt-2">
              <div className="bg-blue-600/30 rounded-full p-2">
                <CalendarDays className="h-5 w-5 text-blue-300" />
              </div>
              <p className="text-3xl font-medium text-white">{appointments.length}</p>
            </div>
            <p className="text-xs text-blue-300 mt-2">Appointments today</p>
          </div>
          
          {/* Next Appointment Card */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/30 rounded-lg shadow-md p-5 border border-indigo-700/30 hover:border-indigo-600/50 transition-all">
            <h3 className="text-sm font-medium text-indigo-200 mb-2">Next Appointment</h3>
            {nextAppointment ? (
              <>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="bg-indigo-600/30 rounded-full p-2">
                    <Clock className="h-5 w-5 text-indigo-300" />
                  </div>
                  <p className="text-2xl font-medium text-white">{nextAppointment.startTime}</p>
                </div>
                <p className="text-xs text-indigo-300 mt-2 truncate">
                  {nextAppointment.patient.firstName} {nextAppointment.patient.lastName} ({nextAppointment.reason})
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="bg-indigo-600/30 rounded-full p-2">
                    <Clock className="h-5 w-5 text-indigo-300/60" />
                  </div>
                  <p className="text-2xl font-medium text-indigo-100/70">No appointments</p>
                </div>
                <p className="text-xs text-indigo-300/70 mt-2">Your schedule is clear for today</p>
              </>
            )}
          </div>
          
          {/* Availability Status Card */}
          <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/30 rounded-lg shadow-md p-5 border border-cyan-700/30 hover:border-cyan-600/50 transition-all">
            <h3 className="text-sm font-medium text-cyan-200 mb-2">Availability Status</h3>
            <div className="flex items-center space-x-3 mt-2">
              <div className={`p-2 rounded-full ${isOnline ? 'bg-green-500/30' : 'bg-gray-600/30'}`}>
                <div className={`h-5 w-5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`}></div>
              </div>
              <p className={`text-xl font-medium ${isOnline ? 'text-green-300' : 'text-gray-400'}`}>
                {isOnline ? 'Online & Available' : 'Currently Offline'}
              </p>
            </div>
            <button 
              onClick={toggleAvailability}
              className="mt-3 text-sm bg-cyan-800/50 hover:bg-cyan-700/50 text-cyan-200 px-3 py-1.5 rounded-md flex items-center w-fit transition-colors"
            >
              <span className="mr-1">{isOnline ? 'Go Offline' : 'Go Online'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
          
          {/* Emergency Requests Card */}
          <div 
            className={`${
              emergencyTransports.length > 0 
                ? 'bg-gradient-to-br from-red-900/50 to-red-800/40 border-red-700/40 hover:border-red-600/60' 
                : 'bg-gradient-to-br from-gray-800/50 to-gray-700/40 border-gray-700/40 hover:border-gray-600/50'
            } rounded-lg shadow-md p-5 border transition-all cursor-pointer`}
            onClick={() => setActiveTab("emergency-transport")}
          >
            <h3 className="text-sm font-medium text-red-200 mb-2">Emergency Requests</h3>
            <div className="flex items-center space-x-3 mt-2">
              <div className={`${
                emergencyTransports.length > 0 ? 'bg-red-500/30' : 'bg-gray-600/30'
              } rounded-full p-2`}>
                <Ambulance className={`h-5 w-5 ${
                  emergencyTransports.length > 0 ? 'text-red-300' : 'text-gray-400'
                }`} />
              </div>
              <p className={`text-3xl font-medium ${
                emergencyTransports.length > 0 ? 'text-white' : 'text-gray-300'
              }`}>{emergencyTransports.length}</p>
            </div>
            {emergencyTransports.length > 0 ? (
              <p className="text-xs text-red-300 mt-2">Active emergency transport requests</p>
            ) : (
              <p className="text-xs text-gray-400 mt-2">No active transport requests</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Doctor Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full border-b border-gray-700 rounded-none p-0 h-auto flex overflow-x-auto">
          <TabsTrigger 
            value="schedule"
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 py-3 px-5 text-sm rounded-none whitespace-nowrap flex-shrink-0 font-medium"
          >
            Today's Schedule
          </TabsTrigger>
          <TabsTrigger 
            value="availability" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 py-3 px-5 text-sm rounded-none whitespace-nowrap flex-shrink-0 font-medium"
          >
            Availability
          </TabsTrigger>
          <TabsTrigger 
            value="patients" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-400 py-3 px-5 text-sm rounded-none whitespace-nowrap flex-shrink-0 font-medium"
          >
            Patient Records
          </TabsTrigger>
          <TabsTrigger 
            value="emergency-transport" 
            className="border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:text-red-400 py-3 px-5 text-sm rounded-none whitespace-nowrap flex-shrink-0 font-medium"
          >
            <div className="flex items-center">
              <Ambulance className="h-4 w-4 mr-2 text-red-500" />
              Emergency Transport
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule" className="px-1">
          <AppointmentSchedule />
        </TabsContent>
        
        <TabsContent value="availability" className="px-1">
          <AvailabilityManager />
        </TabsContent>
        
        <TabsContent value="patients" className="px-1">
          <PatientRecords />
        </TabsContent>
        
        <TabsContent value="emergency-transport" className="px-1">
          <EmergencyTransportDashboard />
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
                isOnline ? "default" : "warning"}
        />
      )}
    </>
  );
}
