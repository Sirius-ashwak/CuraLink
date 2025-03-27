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
    queryKey: [`/api/appointments?doctorId=${doctorInfo?.id}&date=${selectedDate.toISOString().split('T')[0]}`],
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
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-neutral border-b border-neutral-dark flex justify-between items-center">
          <h3 className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</h3>
          <div className="flex">
            <button 
              className="p-1 mr-2 hover:bg-neutral-dark rounded text-text-secondary"
              onClick={goToPreviousDay}
            >
              <span className="material-icons text-sm">chevron_left</span>
            </button>
            <button 
              className="p-1 hover:bg-neutral-dark rounded text-text-secondary"
              onClick={goToNextDay}
            >
              <span className="material-icons text-sm">chevron_right</span>
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : appointments.length > 0 ? (
          <div className="divide-y divide-neutral-dark">
            {appointments.map((appointment: any) => {
              const isCurrent = isCurrentAppointment(appointment);
              
              return (
                <div 
                  key={appointment.id}
                  className={`p-4 ${isCurrent ? 'bg-primary bg-opacity-5 border-l-4 border-primary' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </span>
                        {isCurrent && (
                          <span className="ml-2 text-xs font-medium py-1 px-2 bg-secondary bg-opacity-10 text-secondary rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium mt-1">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </h4>
                      <p className="text-text-secondary text-sm">{appointment.reason}</p>
                    </div>
                    <div className="flex">
                      {isCurrent ? (
                        <Button 
                          size="sm"
                          className="flex items-center"
                          onClick={() => handleJoinCall(appointment.id)}
                        >
                          <span className="material-icons text-sm mr-1">videocam</span>
                          Join
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                          onClick={() => {
                            toast({
                              title: "Patient Details",
                              description: `View details for ${appointment.patient.firstName} ${appointment.patient.lastName}`
                            });
                          }}
                        >
                          <span className="material-icons text-sm mr-1">description</span>
                          View
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
