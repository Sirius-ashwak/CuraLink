import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useWebSocket } from "@/context/WebSocketContext";
import { AppointmentWithUsers } from "@shared/schema";

export function useAppointments() {
  const { user } = useAuth();
  const { messages } = useWebSocket();
  
  const appointmentsQueryKey = user?.role === "doctor" && user?.doctorInfo
    ? [`/api/appointments?doctorId=${user.doctorInfo.id}`]
    : [`/api/appointments?patientId=${user?.id}`];
  
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: appointmentsQueryKey,
    enabled: !!user,
    select: (data: AppointmentWithUsers[]) => {
      // Sort appointments by date (newest first)
      return [...data].sort((a, b) => {
        // First by date
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const dateDiff = dateB.getTime() - dateA.getTime();
        
        if (dateDiff !== 0) return dateDiff;
        
        // If same date, sort by time
        return a.startTime.localeCompare(b.startTime);
      });
    }
  });
  
  // Listen for WebSocket messages about appointments
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && (lastMessage.type === "appointments" || lastMessage.type === "doctorData")) {
    // Refetch appointments when we receive a WebSocket notification
    refetch();
  }
  
  // Filter to show only upcoming appointments
  const upcomingAppointments = (data as AppointmentWithUsers[]).filter(appointment => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    
    // Reset hours to compare just the dates
    today.setHours(0, 0, 0, 0);
    
    // Include appointments for today and future
    return appointmentDate >= today && appointment.status !== "canceled";
  });
  
  return {
    appointments: upcomingAppointments,
    allAppointments: data,
    isLoading,
    refetch
  };
}
