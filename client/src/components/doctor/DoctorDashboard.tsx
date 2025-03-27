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
        <h2 className="text-xl font-medium text-text-primary">Welcome, Dr. {user.lastName}</h2>
        <p className="text-text-secondary">Your schedule for today</p>
        
        <div className="grid grid-cols-1 gap-4 mt-4 sm:grid-cols-3">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-text-secondary">Upcoming</h3>
            <p className="text-2xl font-medium">{appointments.length}</p>
            <p className="text-xs text-text-secondary mt-1">Appointments today</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-text-secondary">Next</h3>
            {nextAppointment ? (
              <>
                <p className="text-2xl font-medium">{nextAppointment.startTime}</p>
                <p className="text-xs text-text-secondary mt-1">
                  {nextAppointment.patient.firstName} {nextAppointment.patient.lastName} ({nextAppointment.reason})
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-medium">-</p>
                <p className="text-xs text-text-secondary mt-1">No more appointments today</p>
              </>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="text-sm font-medium text-text-secondary">Available</h3>
            <div className="flex items-center">
              <span className={`material-icons ${isOnline ? 'text-secondary' : 'text-text-secondary'} mr-1`}>
                {isOnline ? 'circle' : 'cancel'}
              </span>
              <p className={isOnline ? 'text-secondary font-medium' : 'text-text-secondary'}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
            <div className="text-xs text-text-secondary mt-1 flex justify-between">
              <span>Change status</span>
              <span 
                className="material-icons text-sm cursor-pointer"
                onClick={toggleAvailability}
              >
                edit
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Doctor Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 w-full border-b border-neutral-dark rounded-none p-0 h-auto">
          <TabsTrigger 
            value="schedule"
            className="border-b-2 border-transparent data-[state=active]:border-primary py-2 px-4 text-sm rounded-none"
          >
            Today's Schedule
          </TabsTrigger>
          <TabsTrigger 
            value="availability" 
            className="border-b-2 border-transparent data-[state=active]:border-primary py-2 px-4 text-sm rounded-none"
          >
            Availability
          </TabsTrigger>
          <TabsTrigger 
            value="patients" 
            className="border-b-2 border-transparent data-[state=active]:border-primary py-2 px-4 text-sm rounded-none"
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
