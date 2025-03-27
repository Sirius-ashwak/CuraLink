import { useState, useEffect } from "react";
import { useWebSocket } from "@/context/WebSocketContext";
import { X } from "lucide-react";

export default function OfflineIndicator() {
  const { connected } = useWebSocket();
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    if (!connected && !dismissed) {
      // Delay showing the indicator to prevent flashing during temporary disconnections
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [connected, dismissed]);
  
  // Reset dismissed when connection is restored
  useEffect(() => {
    if (connected) {
      setDismissed(false);
    }
  }, [connected]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      id="offline-indicator" 
      className="fixed bottom-16 left-0 right-0 mx-auto w-72 bg-text-primary bg-opacity-90 text-white rounded-lg shadow-lg p-3 flex items-center justify-between z-50 md:bottom-4"
    >
      <div className="flex items-center">
        <span className="material-icons mr-2 offline-indicator">wifi_off</span>
        <span>You're offline. Reconnecting...</span>
      </div>
      <button className="ml-2" onClick={() => setDismissed(true)}>
        <X size={16} />
      </button>
    </div>
  );
}
