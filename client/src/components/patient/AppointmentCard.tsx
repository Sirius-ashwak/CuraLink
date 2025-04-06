import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { formatAppointmentDate, formatAppointmentTime } from "@/lib/dateUtils";
import { AppointmentWithUsers } from "@shared/schema";
import { CalendarDays, Clock, Video, AlertCircle, RefreshCw } from "lucide-react";

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
  
  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case "confirmed":
        return "from-green-600 to-green-700";
      case "pending":
        return "from-amber-600 to-amber-700";
      case "canceled":
        return "from-red-600 to-red-700";
      default:
        return "from-blue-600 to-blue-700";
    }
  };
  
  return (
    <div className={`rounded-xl shadow-lg p-5 border border-gray-800/50 bg-gradient-to-b from-gray-800 to-gray-900 backdrop-blur-sm group hover:shadow-blue-900/20 transition-all duration-300`}>
      <div className="flex items-start space-x-4">
        <div className={`w-1.5 self-stretch rounded-full bg-gradient-to-b ${getStatusColor()}`}></div>
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-base text-white">Dr. {doctor.user.firstName} {doctor.user.lastName}</h4>
            <span className={`text-xs px-2.5 py-1 rounded-full bg-opacity-20 font-medium
              ${status === 'confirmed' ? 'bg-green-900/30 text-green-400 border border-green-700/30' : 
                status === 'pending' ? 'bg-amber-900/30 text-amber-400 border border-amber-700/30' : 
                'bg-red-900/30 text-red-400 border border-red-700/30'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-3">{reason}</p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-400 text-xs">
              <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center text-gray-400 text-xs">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-800/50 flex justify-between items-center">
        <button 
          className={`text-xs font-medium flex items-center px-3 py-1.5 rounded-full 
            ${isLoading || status === "canceled" 
              ? 'bg-red-900/20 text-red-400/50 cursor-not-allowed' 
              : 'bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors duration-300'}`}
          onClick={handleCancel}
          disabled={isLoading || status === "canceled"}
        >
          <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
          Cancel Appointment
        </button>
        {canJoinCall() ? (
          <button 
            className="text-xs font-medium flex items-center px-3 py-1.5 rounded-full
              bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition-colors duration-300"
            onClick={handleJoinCall}
          >
            <Video className="w-3.5 h-3.5 mr-1.5" />
            Join Video Call
          </button>
        ) : (
          <button 
            className="text-xs font-medium flex items-center px-3 py-1.5 rounded-full
              bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 transition-colors duration-300"
            onClick={() => alert("You can reschedule this appointment by canceling and booking a new one.")}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reschedule
          </button>
        )}
      </div>
    </div>
  );
}
