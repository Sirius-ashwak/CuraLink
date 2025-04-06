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
        return {
          gradient: "from-emerald-500 to-green-600",
          glow: "shadow-[0_0_15px_rgba(16,185,129,0.3)]",
          bg: "bg-green-900/30", 
          text: "text-emerald-400", 
          border: "border-emerald-700/30"
        };
      case "scheduled": 
        return {
          gradient: "from-indigo-500 to-blue-600",
          glow: "shadow-[0_0_15px_rgba(99,102,241,0.3)]",
          bg: "bg-indigo-900/30", 
          text: "text-indigo-400", 
          border: "border-indigo-700/30"
        };
      case "canceled": 
        return {
          gradient: "from-rose-500 to-red-600",
          glow: "shadow-[0_0_15px_rgba(244,63,94,0.3)]",
          bg: "bg-red-900/30", 
          text: "text-rose-400", 
          border: "border-rose-700/30"
        };
      case "completed": 
        return {
          gradient: "from-blue-500 to-cyan-600",
          glow: "shadow-[0_0_15px_rgba(14,165,233,0.3)]",
          bg: "bg-cyan-900/30", 
          text: "text-cyan-400", 
          border: "border-cyan-700/30"
        };
      default:
        return {
          gradient: "from-violet-500 to-purple-600",
          glow: "shadow-[0_0_15px_rgba(124,58,237,0.3)]",
          bg: "bg-violet-900/30", 
          text: "text-violet-400", 
          border: "border-violet-700/30"
        };
    }
  };
  
  const statusColors = getStatusColor();
  
  return (
    <div className="rounded-xl shadow-lg p-5 border border-indigo-900/30 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 backdrop-blur-sm group hover:shadow-indigo-900/20 transition-all duration-300 relative overflow-hidden">
      {/* Subtle background glow effect */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 pointer-events-none bg-gradient-to-br ${statusColors.gradient}`}></div>
      
      <div className="flex items-start space-x-4 relative z-10">
        <div className={`w-1.5 self-stretch rounded-full bg-gradient-to-b ${statusColors.gradient} ${statusColors.glow}`}></div>
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-base bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-blue-200">
              Dr. {doctor.user.firstName} {doctor.user.lastName}
            </h4>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${statusColors.bg} ${statusColors.text} border ${statusColors.border} shadow-sm`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          
          <p className="text-indigo-300/80 text-sm mb-4">{reason}</p>
          
          <div className="flex items-center space-x-5">
            <div className="flex items-center text-indigo-400/80 text-xs">
              <CalendarDays className={`w-3.5 h-3.5 mr-2 ${statusColors.text}`} />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center text-indigo-400/80 text-xs">
              <Clock className={`w-3.5 h-3.5 mr-2 ${statusColors.text}`} />
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-5 pt-4 border-t border-indigo-900/30 flex justify-between items-center relative z-10">
        <button 
          className={`text-xs font-medium flex items-center px-4 py-2 rounded-full 
            transition-all duration-300
            ${isLoading || status === "canceled" 
              ? 'bg-rose-900/20 text-rose-400/50 cursor-not-allowed' 
              : 'bg-rose-900/20 text-rose-400 hover:bg-rose-900/30 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]'}`}
          onClick={handleCancel}
          disabled={isLoading || status === "canceled"}
        >
          <AlertCircle className="w-3.5 h-3.5 mr-2" />
          Cancel Appointment
        </button>
        
        {canJoinCall() ? (
          <button 
            className="text-xs font-medium flex items-center px-4 py-2 rounded-full
              bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600
              text-white shadow-[0_0_10px_rgba(79,70,229,0.3)] hover:shadow-[0_0_15px_rgba(79,70,229,0.4)]
              transition-all duration-300"
            onClick={handleJoinCall}
          >
            <Video className="w-3.5 h-3.5 mr-2" />
            Join Video Call
          </button>
        ) : (
          <button 
            className="text-xs font-medium flex items-center px-4 py-2 rounded-full
              bg-indigo-900/20 text-indigo-400 hover:bg-indigo-900/30 hover:text-indigo-300
              border border-indigo-900/40 hover:border-indigo-700/40
              transition-all duration-300"
            onClick={() => alert("You can reschedule this appointment by canceling and booking a new one.")}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Reschedule
          </button>
        )}
      </div>
    </div>
  );
}
