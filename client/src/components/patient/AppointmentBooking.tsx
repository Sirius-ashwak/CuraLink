import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import DoctorSelection from "./DoctorSelection";
import DateSelection from "./DateSelection";
import TimeSelection from "./TimeSelection";
import { DoctorWithUserInfo } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

export default function AppointmentBooking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSpecialty, setSelectedSpecialty] = useState("General Physician");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithUserInfo | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<"video" | "audio">("video");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: doctors = [], isLoading: isLoadingDoctors } = useQuery<DoctorWithUserInfo[]>({
    queryKey: [`/api/doctors?specialty=${selectedSpecialty}`],
    enabled: !!selectedSpecialty,
  });
  
  const handleSpecialtyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecialty(event.target.value);
    setSelectedDoctor(null);
  };
  
  const handleDoctorSelect = (doctor: DoctorWithUserInfo) => {
    setSelectedDoctor(doctor);
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };
  
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to book an appointment",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: "Incomplete Form",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Calculate end time (30 minutes after start time)
    const [hour, minute] = selectedTime.split(":").map(Number);
    let endHour = hour;
    let endMinute = minute + 30;
    
    if (endMinute >= 60) {
      endHour += 1;
      endMinute -= 60;
    }
    
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
    
    try {
      await apiRequest("POST", "/api/appointments", {
        patientId: user.id,
        doctorId: selectedDoctor.id,
        date: selectedDate,
        startTime: selectedTime,
        endTime: endTime,
        status: "scheduled",
        type: consultationType,
        reason: reason,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      
      toast({
        title: "Appointment Booked",
        description: `Your appointment with Dr. ${selectedDoctor.user.lastName} on ${format(selectedDate, "MMMM d")} at ${selectedTime} has been scheduled.`,
      });
      
      // Reset form
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setReason("");
      
      // Scroll to appointments section
      document.getElementById("upcoming-appointments")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <section id="book-appointment" className="rounded-lg shadow-sm p-6 mb-8 border border-gray-700 bg-gray-800">
      <h3 className="text-lg font-medium mb-4 text-white">Book an Appointment</h3>
      
      {/* Specialist Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-200">Select Specialist</label>
        <div className="relative">
          <select 
            className="block appearance-none w-full bg-gray-700 border border-gray-600 text-white rounded py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedSpecialty}
            onChange={handleSpecialtyChange}
          >
            <option>General Physician</option>
            <option>Pediatrician</option>
            <option>Cardiologist</option>
            <option>Dermatologist</option>
            <option>Mental Health Specialist</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
            <span className="material-icons text-sm">expand_more</span>
          </div>
        </div>
      </div>
      
      {/* Doctor Selection */}
      <DoctorSelection 
        doctors={doctors} 
        isLoading={isLoadingDoctors}
        selectedDoctor={selectedDoctor}
        onSelect={handleDoctorSelect}
      />
      
      {/* Only show date and time selection if a doctor is selected */}
      {selectedDoctor && (
        <>
          {/* Calendar */}
          <DateSelection 
            doctorId={selectedDoctor.id}
            onDateSelect={handleDateSelect}
            selectedDate={selectedDate}
          />
          
          {/* Time Slots */}
          {selectedDate && (
            <TimeSelection 
              doctorId={selectedDoctor.id}
              date={selectedDate}
              onTimeSelect={handleTimeSelect}
              selectedTime={selectedTime}
            />
          )}
          
          {/* Consultation Type */}
          {selectedTime && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-200">Consultation Type</label>
                <RadioGroup 
                  value={consultationType} 
                  onValueChange={(value) => setConsultationType(value as "video" | "audio")}
                  className="flex flex-wrap gap-3"
                >
                  <div className="flex items-center">
                    <RadioGroupItem value="video" id="video-consultation" />
                    <Label htmlFor="video-consultation" className="ml-2 text-gray-200">Video Consultation</Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="audio" id="audio-only" />
                    <Label htmlFor="audio-only" className="ml-2 text-gray-200">Audio Only</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* Consultation Reason */}
              <div className="mb-6">
                <label htmlFor="reason" className="block text-sm font-medium mb-2 text-gray-200">
                  Reason for Consultation
                </label>
                <Textarea
                  id="reason"
                  placeholder="Briefly describe your symptoms or reason for the consultation"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="border-gray-600 bg-gray-700 text-white placeholder:text-gray-400"
                />
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Booking..." : "Book Appointment"}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
