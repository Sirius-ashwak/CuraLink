import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAvailability } from "@/hooks/useAvailability";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays } from "date-fns";

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type TimeOffItem = {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
};

export default function AvailabilityManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { availabilityData, isLoading, doctorId, refetch } = useAvailability();
  
  const [weeklySchedule, setWeeklySchedule] = useState<{
    [key in DayOfWeek]: { enabled: boolean; startTime: string; endTime: string; id?: number };
  }>({
    0: { enabled: false, startTime: "09:00", endTime: "17:00" },
    1: { enabled: true, startTime: "09:00", endTime: "17:00" },
    2: { enabled: true, startTime: "09:00", endTime: "17:00" },
    3: { enabled: true, startTime: "09:00", endTime: "17:00" },
    4: { enabled: true, startTime: "09:00", endTime: "17:00" },
    5: { enabled: true, startTime: "09:00", endTime: "17:00" },
    6: { enabled: false, startTime: "09:00", endTime: "13:00" },
  });
  
  const [timeOff, setTimeOff] = useState<TimeOffItem[]>([]);
  const [newTimeOff, setNewTimeOff] = useState({
    title: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingTimeOff, setIsAddingTimeOff] = useState(false);
  
  useEffect(() => {
    if (availabilityData && !isLoading) {
      const { availability, timeOffs } = availabilityData;
      
      // Update weekly schedule from availability data
      const scheduleFromData = { ...weeklySchedule };
      availability.forEach((slot) => {
        const day = slot.dayOfWeek as DayOfWeek;
        scheduleFromData[day] = {
          enabled: slot.isAvailable,
          startTime: slot.startTime,
          endTime: slot.endTime,
          id: slot.id,
        };
      });
      setWeeklySchedule(scheduleFromData);
      
      // Update time off from data
      if (timeOffs) {
        setTimeOff(
          timeOffs.map((item: any) => ({
            id: item.id,
            title: item.title,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
          }))
        );
      }
    }
  }, [availabilityData, isLoading]);
  
  const handleDayToggle = (day: DayOfWeek) => {
    setWeeklySchedule({
      ...weeklySchedule,
      [day]: {
        ...weeklySchedule[day],
        enabled: !weeklySchedule[day].enabled,
      },
    });
  };
  
  const handleTimeChange = (day: DayOfWeek, field: "startTime" | "endTime", value: string) => {
    setWeeklySchedule({
      ...weeklySchedule,
      [day]: {
        ...weeklySchedule[day],
        [field]: value,
      },
    });
  };
  
  const handleSaveChanges = async () => {
    if (!doctorId) return;
    
    setIsSaving(true);
    try {
      // Update or create availability for each day
      for (const [dayStr, schedule] of Object.entries(weeklySchedule)) {
        const day = parseInt(dayStr) as DayOfWeek;
        
        if (schedule.id) {
          // Update existing availability
          await apiRequest("PATCH", `/api/doctors/${doctorId}/availability/${schedule.id}`, {
            isAvailable: schedule.enabled,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
          });
        } else {
          // Create new availability
          await apiRequest("POST", `/api/doctors/${doctorId}/availability`, {
            dayOfWeek: day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isAvailable: schedule.enabled,
          });
        }
      }
      
      await refetch();
      
      toast({
        title: "Schedule Updated",
        description: "Your availability schedule has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update your availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddTimeOff = async () => {
    if (!doctorId) return;
    
    setIsAddingTimeOff(true);
    try {
      await apiRequest("POST", `/api/doctors/${doctorId}/time-off`, {
        title: newTimeOff.title,
        startDate: newTimeOff.startDate,
        endDate: newTimeOff.endDate,
      });
      
      await refetch();
      
      // Reset form
      setNewTimeOff({
        title: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      });
      
      toast({
        title: "Time Off Added",
        description: "Your time off has been scheduled successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to Add Time Off",
        description: "An error occurred while adding time off. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingTimeOff(false);
    }
  };
  
  const handleDeleteTimeOff = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/time-off/${id}`, undefined);
      await refetch();
      
      toast({
        title: "Time Off Removed",
        description: "Your time off has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to remove time off. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading || !doctorId) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <section className="mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Manage Your Availability</h3>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-3">Regular Hours</h4>
            <div className="space-y-4">
              {(Object.keys(weeklySchedule) as unknown as DayOfWeek[]).map((day) => (
                <div key={day} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Checkbox
                      id={`day-${day}`}
                      checked={weeklySchedule[day].enabled}
                      onCheckedChange={() => handleDayToggle(day)}
                    />
                    <label
                      htmlFor={`day-${day}`}
                      className="ml-2 text-sm font-medium cursor-pointer"
                    >
                      {dayNames[day]}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={weeklySchedule[day].startTime}
                      onChange={(e) => handleTimeChange(day, "startTime", e.target.value)}
                      disabled={!weeklySchedule[day].enabled}
                      className="w-32 text-sm"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={weeklySchedule[day].endTime}
                      onChange={(e) => handleTimeChange(day, "endTime", e.target.value)}
                      disabled={!weeklySchedule[day].enabled}
                      className="w-32 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Time Off & Exceptions</h4>
            <div className="space-y-4">
              {timeOff.length > 0 ? (
                timeOff.map((item) => (
                  <div key={item.id} className="border border-neutral-dark rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium text-sm">{item.title}</h5>
                        <p className="text-text-secondary text-xs">
                          {format(item.startDate, "MMM d, yyyy")} - {format(item.endDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <button
                        className="text-error text-sm"
                        onClick={() => handleDeleteTimeOff(item.id)}
                      >
                        <span className="material-icons text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-text-secondary text-sm">
                  No scheduled time off
                </div>
              )}
              
              <div className="border border-neutral-dark rounded-lg p-3">
                <h5 className="font-medium text-sm mb-2">Add New Time Off</h5>
                <div className="space-y-2">
                  <Input
                    placeholder="Title (e.g. Medical Conference)"
                    value={newTimeOff.title}
                    onChange={(e) => setNewTimeOff({ ...newTimeOff, title: e.target.value })}
                    className="text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-text-secondary">Start Date</label>
                      <Input
                        type="date"
                        value={newTimeOff.startDate}
                        onChange={(e) =>
                          setNewTimeOff({ ...newTimeOff, startDate: e.target.value })
                        }
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary">End Date</label>
                      <Input
                        type="date"
                        value={newTimeOff.endDate}
                        onChange={(e) =>
                          setNewTimeOff({ ...newTimeOff, endDate: e.target.value })
                        }
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleAddTimeOff}
                    disabled={
                      isAddingTimeOff || !newTimeOff.title || !newTimeOff.startDate || !newTimeOff.endDate
                    }
                  >
                    <span className="material-icons text-sm mr-1">add</span>
                    {isAddingTimeOff ? "Adding..." : "Add Time Off"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-neutral-dark flex justify-end">
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </section>
  );
}
