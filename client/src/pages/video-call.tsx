import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import VideoConsultation from "@/components/video/VideoConsultation";
import { Skeleton } from "@/components/ui/skeleton";

export default function VideoCall() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute<{ id: string }>("/video-call/:id");
  
  if (!match || !params) {
    setLocation("/dashboard");
    return null;
  }
  
  const appointmentId = parseInt(params.id);
  
  const { data: appointment, isLoading, error } = useQuery({
    queryKey: [`/api/appointments/${appointmentId}`],
    enabled: !!appointmentId && !!user,
  });
  
  // Verify user has access to this appointment
  useEffect(() => {
    if (!isLoading && appointment) {
      const isPatient = user?.id === appointment.patientId;
      const isDoctor = user?.role === "doctor" && user?.doctorInfo?.id === appointment.doctorId;
      
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
