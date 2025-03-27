import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatAppointmentDate, formatAppointmentTime } from "@/lib/dateUtils";
import { AppointmentWithUsers } from "@shared/schema";

interface AppointmentCardProps {
  appointment: AppointmentWithUsers;
}

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const { doctor, date, startTime, endTime, status, type, reason } = appointment;
  const formattedDate = formatAppointmentDate(new Date(date));
  const formattedTime = formatAppointmentTime(startTime);
  
  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    
    setIsLoading(true);
    try {
      await apiRequest("DELETE", `/api/appointments/${appointment.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      
      toast({
        title: "Appointment canceled",
        description: "Your appointment has been successfully canceled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel the appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleJoinCall = () => {
    setLocation(`/video-call/${appointment.id}`);
  };
  
  const isToday = () => {
    const today = new Date();
    const appointmentDate = new Date(date);
    return (
      today.getDate() === appointmentDate.getDate() &&
      today.getMonth() === appointmentDate.getMonth() &&
      today.getFullYear() === appointmentDate.getFullYear()
    );
  };
  
  const canJoinCall = () => {
    if (status !== "confirmed") return false;
    if (!isToday()) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const [appointmentHour, appointmentMinute] = startTime.split(":").map(Number);
    const minutesDiff = 
      (currentHour - appointmentHour) * 60 + (currentMinute - appointmentMinute);
    
    // Can join 5 minutes before and up to 30 minutes after start time
    return minutesDiff >= -5 && minutesDiff <= 30;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-start">
        <div className="bg-primary w-2 h-full rounded-full mr-4 self-stretch"></div>
        <div className="flex-grow">
          <div className="flex justify-between">
            <h4 className="font-medium">Dr. {doctor.user.firstName} {doctor.user.lastName}</h4>
            <span className="text-sm text-secondary font-medium">{status}</span>
          </div>
          <p className="text-text-secondary text-sm">{reason}</p>
          <div className="mt-2 flex items-center">
            <span className="material-icons text-text-secondary text-sm mr-1">calendar_today</span>
            <span className="text-sm">{formattedDate}, {formattedTime}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-neutral-dark flex justify-between">
        <button 
          className="text-error text-sm font-medium flex items-center"
          onClick={handleCancel}
          disabled={isLoading || status === "canceled"}
        >
          <span className="material-icons text-sm mr-1">cancel</span>
          Cancel
        </button>
        {canJoinCall() ? (
          <button 
            className="text-primary text-sm font-medium flex items-center"
            onClick={handleJoinCall}
          >
            <span className="material-icons text-sm mr-1">videocam</span>
            Join Call
          </button>
        ) : (
          <button 
            className="text-primary text-sm font-medium flex items-center"
            onClick={() => alert("You can reschedule this appointment by canceling and booking a new one.")}
          >
            <span className="material-icons text-sm mr-1">schedule</span>
            Reschedule
          </button>
        )}
      </div>
    </div>
  );
}
