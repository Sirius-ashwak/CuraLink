import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import VideoConsultation from "@/components/video/VideoConsultation";
import { Skeleton } from "@/components/ui/skeleton";
import { Video } from "lucide-react";
import { AppointmentWithUsers } from "@shared/schema";

export default function VideoCall() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/video-call/:id");
  
  // Check if we're on the base video-call route without an ID
  if (!match && window.location.pathname === "/video-call") {
    // Show video call lobby without a specific appointment
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center p-6">
        <div className="text-center text-white max-w-md">
          <div className="w-20 h-20 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-6">
            <Video className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Video Consultation</h2>
          <p className="text-gray-300 mb-6">
            You can start a new consultation or join an existing one by entering an appointment ID.
          </p>
          <button 
            onClick={() => setLocation("/dashboard")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  // If we're supposed to have an ID but don't, redirect to dashboard
  if (!match || !params) {
    setLocation("/dashboard");
    return null;
  }
  
  const appointmentId = parseInt(params.id);
  
  const { data: appointment, isLoading, error } = useQuery<AppointmentWithUsers>({
    queryKey: [`/api/appointments/${appointmentId}`],
    enabled: !!appointmentId && !!user,
  });
  
  // Verify user has access to this appointment
  useEffect(() => {
    if (!isLoading && appointment) {
      const isPatient = user?.id === appointment.patientId;
      // If user is a doctor, we'll need to find their doctor profile ID to compare
      const isDoctor = user?.role === "doctor" && appointment.doctorId !== undefined;
      
      if (!isPatient && !isDoctor) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to join this call",
          variant: "destructive",
        });
        setLocation("/dashboard");
      }
    }
  }, [appointment, isLoading, user, toast, setLocation]);
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load appointment details",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [error, toast, setLocation]);
  
  const handleEndCall = () => {
    setLocation("/dashboard");
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-text-primary z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <Skeleton className="w-16 h-16 bg-gray-700 rounded-full mx-auto" />
          <h3 className="mt-4 text-xl font-medium">Connecting to your appointment...</h3>
        </div>
      </div>
    );
  }
  
  if (!appointment) {
    return null; // Will redirect in useEffect
  }
  
  // Get the names for the call
  const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
  const doctorName = `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`;
  
  return (
    <VideoConsultation
      appointmentId={appointmentId}
      patientName={patientName}
      doctorName={doctorName}
      onEndCall={handleEndCall}
    />
  );
}
