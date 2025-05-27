import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export default function SimpleAvailabilityManager() {
  const [schedule, setSchedule] = useState({
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "09:00", end: "13:00" },
    sunday: { enabled: false, start: "09:00", end: "13:00" },
  });

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  const handleDayToggle = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-medium mb-6 text-gray-900 dark:text-white">Weekly Availability</h3>
      
      <div className="space-y-4">
        {days.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={schedule[key].enabled}
                onCheckedChange={() => handleDayToggle(key)}
              />
              <label className="font-medium text-gray-900 dark:text-white min-w-[100px]">
                {label}
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Input
                type="time"
                value={schedule[key].start}
                onChange={(e) => handleTimeChange(key, 'start', e.target.value)}
                disabled={!schedule[key].enabled}
                className="w-32"
              />
              <span className="text-gray-500 dark:text-gray-400">to</span>
              <Input
                type="time"
                value={schedule[key].end}
                onChange={(e) => handleTimeChange(key, 'end', e.target.value)}
                disabled={!schedule[key].enabled}
                className="w-32"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          Save Availability
        </Button>
      </div>
    </div>
  );
}