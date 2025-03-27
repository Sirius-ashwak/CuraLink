import { createContext, ReactNode, useState, useEffect, useCallback, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface WebSocketContextType {
  connected: boolean;
  messages: any[];
  sendMessage: (message: any) => void;
}

export const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  messages: [],
  sendMessage: () => {},
});

// Create the useWebSocket hook
export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  
  const connect = useCallback(() => {
    if (!user) {
      setSocket(null);
      setConnected(false);
      return;
    }
    
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const newSocket = new WebSocket(wsUrl);
      
      newSocket.onopen = () => {
        setConnected(true);
        setReconnectAttempts(0);
        
        // Send authentication message
        newSocket.send(
          JSON.stringify({
            type: "auth",
            userId: user.id,
            role: user.role,
          })
        );
      };
      
      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => [...prev, data]);
          
          // Handle specific message types
          if (data.type === "doctorUpdate") {
            // A doctor's availability has changed
            toast({
              title: "Doctor Availability Updated",
              description: `A doctor's availability has been updated.`,
            });
          } else if (data.type === "appointmentUpdate") {
            // An appointment status has changed
            toast({
              title: "Appointment Updated",
              description: `An appointment has been ${data.data.status}.`,
            });
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };
      
      newSocket.onclose = () => {
        setConnected(false);
        
        // Attempt to reconnect if not at max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, 2000 * Math.pow(2, reconnectAttempts)); // Exponential backoff
        } else {
          toast({
            title: "Connection Lost",
            description: "Failed to reconnect to the server. Please refresh the page.",
            variant: "destructive",
          });
        }
      };
      
      newSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        newSocket.close();
      };
      
      setSocket(newSocket);
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
    }
  }, [user, reconnectAttempts, toast]);
  
  // Connect to WebSocket when user changes
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [connect, socket]);
  
  // Send message function
  const sendMessage = useCallback(
    (message: any) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket is not connected, message not sent");
      }
    },
    [socket]
  );
  
  return (
    <WebSocketContext.Provider value={{ connected, messages, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};
