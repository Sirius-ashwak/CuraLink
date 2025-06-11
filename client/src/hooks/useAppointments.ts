import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
// WebSocket removed for better reliability in remote areas
import { AppointmentWithUsers } from "@shared/schema";

export function useAppointments() {
  const { user } = useAuth();
  // Real-time updates removed for better reliability
  
  const appointmentsQueryKey = user?.role === "doctor" && user?.specialty
    ? [`/api/appointments/doctor/${user?.id}`]
    : [`/api/appointments/patient/${user?.id}`];
  
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
  
  // Appointments are fetched via HTTP requests for better reliability
  
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
