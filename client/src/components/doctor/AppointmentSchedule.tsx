import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, subDays, startOfDay } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function AppointmentSchedule() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
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
  
  // Get appointments for selected date
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["/api/appointments", { doctorId: doctorInfo?.id, date: selectedDate.toISOString().split('T')[0] }],
    enabled: !!doctorInfo,
  });
  
  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };
  
  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };
  
  const handleJoinCall = (appointmentId: number) => {
    setLocation(`/video-call/${appointmentId}`);
  };
  
  const isCurrentAppointment = (appointment: any) => {
    const now = new Date();
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
    
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes);
    
    const endTime = new Date(selectedDate);
    endTime.setHours(endHours, endMinutes);
    
    return now >= startTime && now <= endTime;
  };
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };
  
  if (!doctorInfo) return null;
  
  return (
    <section className="mb-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-medium text-gray-900 dark:text-white">{format(selectedDate, 'MMMM d, yyyy')}</h3>
          <div className="flex">
            <button 
              className="p-1 mr-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
              onClick={goToPreviousDay}
            >
              ←
            </button>
            <button 
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
              onClick={goToNextDay}
            >
              →
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : Array.isArray(appointments) && appointments.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {appointments.map((appointment: any) => {
              const isCurrent = isCurrentAppointment(appointment);
              
              return (
                <div 
                  key={appointment.id}
                  className={`p-4 ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </span>
                        {isCurrent && (
                          <span className="ml-2 text-xs font-medium py-1 px-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium mt-1 text-gray-900 dark:text-white">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{appointment.reason}</p>
                    </div>
                    <div className="flex">
                      {isCurrent ? (
                        <Button 
                          size="sm"
                          className="flex items-center bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleJoinCall(appointment.id)}
                        >
                          📹 Join Video Call
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          size="sm"
                          className="flex items-center border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                          onClick={() => {
                            toast({
                              title: "Patient Details",
                              description: `View details for ${appointment.patient.firstName} ${appointment.patient.lastName}`
                            });
                          }}
                        >
                          📋 View Details
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-3 pt-3 border-t border-neutral-dark text-sm">
                      <span className="font-medium">Notes:</span>
                      <span className="text-text-secondary">{appointment.notes}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-text-secondary">No appointments scheduled for this day</p>
          </div>
        )}
      </div>
    </section>
  );
}
