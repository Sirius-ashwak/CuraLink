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
    <div className="relative w-3 h-3">
      <span 
        className={`absolute inset-0 rounded-full ${
          status === "online" ? "bg-green-500" : "bg-red-500"
        }`}
      ></span>
      <span 
        className={`absolute inset-0 rounded-full ${
          status === "online" ? "bg-green-400" : "bg-red-400"
        } animate-ping opacity-75`}
        style={{ animationDuration: '2s' }}
      ></span>
    </div>
  );
}
