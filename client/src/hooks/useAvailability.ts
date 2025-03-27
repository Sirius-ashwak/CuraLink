import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useWebSocket } from "@/context/WebSocketContext";

export function useAvailability() {
  const { user } = useAuth();
  const { messages } = useWebSocket();
  
  // Determine doctor ID
  let doctorId = null;
  
  if (user?.role === "doctor" && user?.doctorInfo) {
    // For doctors, use their own ID
    doctorId = user.doctorInfo.id;
  }
  
  const {
    data: availabilityData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: [`/api/doctors/${doctorId}/availability`],
    enabled: !!doctorId,
  });
  
  // Listen for WebSocket messages about availability changes
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.type === "doctorData") {
    // Refetch availability when we receive an update
    refetch();
  }
  
  return {
    availabilityData,
    isLoading,
    doctorId,
    refetch
  };
}
