import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useWebSocket } from "@/context/WebSocketContext";
import AppointmentSchedule from "./AppointmentSchedule";
import AvailabilityManager from "./AvailabilityManager";
import PatientRecords from "./PatientRecords";
import OfflineIndicator from "../notifications/OfflineIndicator";
import NotificationToast from "../notifications/NotificationToast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { CalendarDays, Clock } from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { sendMessage } = useWebSocket();
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
  
  if (!user || user.role !== "doctor") return null;
  
  return (
    <>
      {/* Welcome & Stats */}
      <div className="mb-6">
        <h2 className="text-xl font-medium text-white">Welcome, Dr. {user.lastName}</h2>
        <p className="text-gray-400">Your schedule for today</p>
        
        <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="bg-gray-900 rounded-lg shadow-sm p-4 border border-gray-800">
            <h3 className="text-sm font-medium text-gray-400">Today's Schedule</h3>
            <div className="flex items-center space-x-2 mt-1">
              <CalendarDays className="h-5 w-5 text-blue-500" />
              <p className="text-2xl font-medium text-white">{appointments.length}</p>
            </div>
            <p className="text-xs text-gray-400 mt-1">Appointments today</p>
          </div>
          
          <div className="bg-gray-900 rounded-lg shadow-sm p-4 border border-gray-800">
            <h3 className="text-sm font-medium text-gray-400">Next Appointment</h3>
            {nextAppointment ? (
              <>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <p className="text-xl font-medium text-white">{nextAppointment.startTime}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {nextAppointment.patient.firstName} {nextAppointment.patient.lastName} ({nextAppointment.reason})
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <p className="text-xl font-medium text-white">-</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">No more appointments today</p>
              </>
            )}
          </div>
          
          <div className="bg-gray-900 rounded-lg shadow-sm p-4 border border-gray-800">
            <h3 className="text-sm font-medium text-gray-400">Availability Status</h3>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <p className={`text-lg font-medium ${isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            <button 
              onClick={toggleAvailability}
              className="mt-2 text-xs text-blue-500 hover:text-blue-400 flex items-center"
            >
              <span className="mr-1">Change status</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Doctor Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full border-b border-gray-800 rounded-none p-0 h-auto flex overflow-x-auto scrollbar-hide">
          <TabsTrigger 
            value="schedule"
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 py-2 px-4 text-sm rounded-none whitespace-nowrap flex-shrink-0 text-white"
          >
            Today's Schedule
          </TabsTrigger>
          <TabsTrigger 
            value="availability" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 py-2 px-4 text-sm rounded-none whitespace-nowrap flex-shrink-0 text-white"
          >
            Availability
          </TabsTrigger>
          <TabsTrigger 
            value="patients" 
            className="border-b-2 border-transparent data-[state=active]:border-blue-500 py-2 px-4 text-sm rounded-none whitespace-nowrap flex-shrink-0 text-white"
          >
            Patient Records
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule">
          <AppointmentSchedule />
        </TabsContent>
        
        <TabsContent value="availability">
          <AvailabilityManager />
        </TabsContent>
        
        <TabsContent value="patients">
          <PatientRecords />
        </TabsContent>
      </Tabs>
      
      {/* Notifications */}
      <OfflineIndicator />
      {showNotification && (
        <NotificationToast 
          title={notification.title}
          message={notification.message}
          onClose={() => setShowNotification(false)}
          type={isOnline ? "success" : "info"}
        />
      )}
    </>
  );
}
