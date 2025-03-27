import { useState, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isAfter, isBefore } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface DateSelectionProps {
  doctorId: number;
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export default function DateSelection({ doctorId, onDateSelect, selectedDate }: DateSelectionProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get doctor's availability for the current month
  const { data: availabilityData, isLoading } = useQuery({
    queryKey: [`/api/doctors/${doctorId}/availability`],
  });
  
  // Get doctor's appointments
  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: [`/api/appointments?doctorId=${doctorId}`],
  });
  
  // Get all days in the current month
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  // Move to previous month
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Move to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Check if a date is available for appointments
  const isDateAvailable = (date: Date) => {
    // Doctor not available on weekends
    if (date.getDay() === 0 || date.getDay() === 6) return false;
    
    // Can't book in the past
    if (isBefore(date, new Date()) && !isToday(date)) return false;
    
    // Can't book more than 3 months in the future
    if (isAfter(date, addMonths(new Date(), 3))) return false;
    
    // Check if doctor has a timeOff that includes this date
    if (availabilityData?.timeOffs) {
      const isTimeOff = availabilityData.timeOffs.some((timeOff: any) => {
        const startDate = new Date(timeOff.startDate);
        const endDate = new Date(timeOff.endDate);
        return (
          (isAfter(date, startDate) || isSameDay(date, startDate)) && 
          (isBefore(date, endDate) || isSameDay(date, endDate))
        );
      });
      if (isTimeOff) return false;
    }
    
    return true;
  };
  
  if (isLoading || isLoadingAppointments) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">Select Date</label>
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-text-secondary mb-2">Select Date</label>
      <div className="bg-neutral rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <button 
            className="p-1 hover:bg-neutral-dark rounded-full"
            onClick={prevMonth}
          >
            <span className="material-icons">chevron_left</span>
          </button>
          <h4 className="font-medium">{format(currentMonth, 'MMMM yyyy')}</h4>
          <button 
            className="p-1 hover:bg-neutral-dark rounded-full"
            onClick={nextMonth}
          >
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          <div className="text-xs font-medium text-text-secondary">Sun</div>
          <div className="text-xs font-medium text-text-secondary">Mon</div>
          <div className="text-xs font-medium text-text-secondary">Tue</div>
          <div className="text-xs font-medium text-text-secondary">Wed</div>
          <div className="text-xs font-medium text-text-secondary">Thu</div>
          <div className="text-xs font-medium text-text-secondary">Fri</div>
          <div className="text-xs font-medium text-text-secondary">Sat</div>
          
          {/* Empty cells for days of the week before the start of the month */}
          {Array(startOfMonth(currentMonth).getDay())
            .fill(null)
            .map((_, index) => (
              <div key={`empty-${index}`} className="calendar-day"></div>
            ))}
          
          {/* Calendar dates */}
          {days.map((day) => {
            const isAvailable = isDateAvailable(day);
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
            
            return (
              <div 
                key={day.toISOString()}
                className={`calendar-day ${
                  isAvailable 
                    ? 'available' 
                    : 'unavailable'
                } ${
                  isSelected ? 'selected' : ''
                }`}
                onClick={() => isAvailable && onDateSelect(day)}
              >
                {format(day, 'd')}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
