import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export function useAvailability() {
  const { user } = useAuth();
  
  // Get doctor information first
  const { data: doctorData } = useQuery({
    queryKey: ["/api/doctors"],
    select: (data) => {
      if (user && Array.isArray(data)) {
        return data.find((doctor) => doctor.userId === user.id);
      }
      return null;
    },
    enabled: !!user && user.role === "doctor",
  });
  
  // Get the doctor ID from the doctor data
  const doctorId = doctorData?.id || null;
  
  // Fetch availability data with the doctor ID
  const {
    data: availabilityData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: [`/api/doctors/${doctorId}/availability`],
    enabled: !!doctorId,
    // Using polling for reliability instead of WebSockets
    refetchInterval: 15000, // Refresh data every 15 seconds
  });
  
  return {
    availabilityData,
    isLoading,
    doctorId,
    refetch
  };
}
