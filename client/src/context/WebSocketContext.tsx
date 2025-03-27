import { createContext, ReactNode, useState, useEffect, useCallback, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface WebSocketContextType {
  connected: boolean;
  messages: any[];
  sendMessage: (message: any) => void;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  messages: [],
  sendMessage: () => {},
  enabled: true,
  setEnabled: () => {},
});

// Create the useWebSocket hook
export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

// Store websocket state in localStorage to persist between page reloads
const isWebSocketEnabled = () => {
  const stored = localStorage.getItem("websocket_enabled");
  return stored === null || stored === "true"; // Default to true
};

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [enabled, setEnabledState] = useState<boolean>(isWebSocketEnabled());
  const maxReconnectAttempts = 3; // Reduced max attempts to avoid excessive retries
  
  // Update localStorage and state when enabled/disabled
  const setEnabled = useCallback((value: boolean) => {
    localStorage.setItem("websocket_enabled", value.toString());
    setEnabledState(value);
    
    // If enabling again and we have a user, try to reconnect
    if (value && user && !connected && !socket) {
      setReconnectAttempts(0);
      // Use a slight delay to allow state to update
      setTimeout(() => connect(), 100);
    } else if (!value && socket) {
      // If disabling, close any existing connection
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  }, [user, connected, socket]);
  
  const connect = useCallback(() => {
    // Don't connect if websockets are disabled or user isn't logged in
    if (!enabled || !user) {
      setSocket(null);
      setConnected(false);
      return;
    }
    
    // Don't attempt to reconnect if we've exceeded our limit
    if (reconnectAttempts >= maxReconnectAttempts) {
      // Only show the toast once when we hit the limit
      if (reconnectAttempts === maxReconnectAttempts) {
        toast({
          title: "Connection Issues",
          description: "Unable to establish real-time connection. Some features may be limited.",
          variant: "destructive",
        });
        // Disable WebSockets after too many failed attempts
        setEnabled(false);
      }
      return;
    }
    
    try {
      // Close any existing socket before creating a new one
      if (socket) {
        socket.close();
      }
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Attempting to connect to WebSocket (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
      
      const newSocket = new WebSocket(wsUrl);
      let openHandled = false;
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (!openHandled && newSocket.readyState !== WebSocket.OPEN) {
          console.warn("WebSocket connection timeout");
          newSocket.close();
        }
      }, 5000);
      
      newSocket.onopen = () => {
        openHandled = true;
        clearTimeout(connectionTimeout);
        console.log("WebSocket connected successfully");
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
      
      newSocket.onclose = (event) => {
        openHandled = true;
        clearTimeout(connectionTimeout);
        setConnected(false);
        setSocket(null);
        
        console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
        
        // Attempt to reconnect if not at max attempts and still enabled
        if (reconnectAttempts < maxReconnectAttempts && enabled) {
          const delay = 2000 * Math.pow(2, reconnectAttempts); // Exponential backoff
          console.log(`Reconnecting in ${delay}ms...`);
          
          setTimeout(() => {
            setReconnectAttempts((prev) => prev + 1);
            connect();
          }, delay);
        }
      };
      
      newSocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        // Let the onclose handler deal with reconnection
      };
      
      setSocket(newSocket);
    } catch (error) {
      console.error("Failed to connect to WebSocket:", error);
      
      // Increment reconnect attempts and try again with backoff
      if (reconnectAttempts < maxReconnectAttempts && enabled) {
        const delay = 2000 * Math.pow(2, reconnectAttempts);
        setTimeout(() => {
          setReconnectAttempts((prev) => prev + 1);
          connect();
        }, delay);
      }
    }
  }, [user, reconnectAttempts, toast, enabled, socket]);
  
  // Connect to WebSocket when user changes or when enabled changes
  useEffect(() => {
    if (enabled && user) {
      connect();
    } else if (!enabled || !user) {
      // Cleanup if disabled or user logs out
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
        setSocket(null);
      }
      setConnected(false);
    }
    
    // Clean up on unmount
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [connect, socket, user, enabled]);
  
  // Send message function with fallback for when WebSocket is not connected
  const sendMessage = useCallback(
    (message: any) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else if (enabled) {
        // If WebSocket is meant to be enabled but not connected, try to connect
        console.warn("WebSocket is not connected, attempting to reconnect");
        
        // Store the message in session storage to send once connected
        // (In a real app, you might use an outgoing message queue)
        console.log("Message not sent:", message);
      }
    },
    [socket, enabled]
  );
  
  return (
    <WebSocketContext.Provider value={{ connected, messages, sendMessage, enabled, setEnabled }}>
      {children}
      {/* Connection indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          style={{
            position: 'fixed',
            bottom: '5px',
            right: '5px',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '4px',
            backgroundColor: connected ? 'rgba(0, 128, 0, 0.8)' : enabled ? 'rgba(255, 0, 0, 0.8)' : 'rgba(128, 128, 128, 0.8)',
            color: 'white',
            zIndex: 9999,
            cursor: 'pointer',
          }}
          onClick={() => setEnabled(!enabled)}
          title={enabled ? "Click to disable WebSocket" : "Click to enable WebSocket"}
        >
          {connected ? "WebSocket Connected" : enabled ? "WebSocket Disconnected" : "WebSocket Disabled"}
        </div>
      )}
    </WebSocketContext.Provider>
  );
};
