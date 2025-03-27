import { useState, useEffect } from "react";
import { useWebSocket } from "@/context/WebSocketContext";

export default function ConnectionStatus() {
  const { connected } = useWebSocket();
  const [status, setStatus] = useState<"online" | "offline">("online");
  
  useEffect(() => {
    setStatus(connected ? "online" : "offline");
    
    const handleOnline = () => setStatus("online");
    const handleOffline = () => setStatus("offline");
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [connected]);
  
  return (
    <div className="relative connection-status">
      <span 
        className={`material-icons text-sm ${
          status === "online" ? "text-secondary" : "text-error" 
        }`}
      >
        {status === "online" ? "wifi" : "wifi_off"}
      </span>
      <span 
        className={`absolute -top-1 -right-1 h-2 w-2 ${
          status === "online" ? "bg-secondary" : "bg-error"
        } rounded-full`}
      ></span>
    </div>
  );
}
