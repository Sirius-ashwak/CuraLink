import { format, isToday, isTomorrow, addDays } from "date-fns";

/**
 * Formats a date for display in appointment cards
 * - Today -> "Today"
 * - Tomorrow -> "Tomorrow"
 * - This week -> "Friday"
 * - Beyond this week -> "October 18"
 */
export function formatAppointmentDate(date: Date): string {
  if (isToday(date)) {
    return "Today";
  }
  
  if (isTomorrow(date)) {
    return "Tomorrow";
  }
  
  const now = new Date();
  const weekEnd = addDays(now, 6);
  
  if (date <= weekEnd) {
    return format(date, "EEEE"); // Day of week
  }
  
  return format(date, "MMMM d");
}

/**
 * Formats a time string (HH:MM) to a more readable format (h:MM AM/PM)
 */
export function formatAppointmentTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

/**
 * Gets the day of week index (0-6) for a date
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Checks if a time slot is available on a given date
 */
export function isTimeSlotAvailable(
  date: Date,
  time: string,
  appointments: any[],
  availability: any[],
  timeOffs: any[]
): boolean {
  // 1. Check if the day is available in weekly schedule
  const dayOfWeek = getDayOfWeek(date);
  const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek);
  
  if (!dayAvailability || !dayAvailability.isAvailable) {
    return false;
  }
  
  // 2. Check if there's time off on this date
  const dateString = format(date, "yyyy-MM-dd");
  const hasTimeOff = timeOffs.some(timeOff => {
    const startDate = format(new Date(timeOff.startDate), "yyyy-MM-dd");
    const endDate = format(new Date(timeOff.endDate), "yyyy-MM-dd");
    return dateString >= startDate && dateString <= endDate;
  });
  
  if (hasTimeOff) {
    return false;
  }
  
  // 3. Check if the time is within the available hours
  const [hours, minutes] = time.split(":").map(Number);
  const timeValue = hours * 60 + minutes;
  
  const [startHours, startMinutes] = dayAvailability.startTime.split(":").map(Number);
  const startTimeValue = startHours * 60 + startMinutes;
  
  const [endHours, endMinutes] = dayAvailability.endTime.split(":").map(Number);
  const endTimeValue = endHours * 60 + endMinutes;
  
  if (timeValue < startTimeValue || timeValue >= endTimeValue) {
    return false;
  }
  
  // 4. Check if there's already an appointment at this time
  const hasAppointment = appointments.some(appointment => {
    const appointmentDate = format(new Date(appointment.date), "yyyy-MM-dd");
    if (appointmentDate !== dateString) {
      return false;
    }
    
    return appointment.startTime === time;
  });
  
  return !hasAppointment;
}
