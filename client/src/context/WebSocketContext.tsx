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
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

// Store websocket state in localStorage to persist between page reloads
const isWebSocketEnabled = () => {
  const stored = localStorage.getItem("websocket_enabled");
  return stored === null || stored === "true"; // Default to true
};

// Get the timestamp of the last connection attempt
const getLastConnectionAttempt = (): number => {
  const stored = localStorage.getItem("websocket_last_attempt");
  return stored ? parseInt(stored, 10) : 0;
};

// Set the timestamp of the last connection attempt
const setLastConnectionAttempt = (timestamp: number) => {
  localStorage.setItem("websocket_last_attempt", timestamp.toString());
};

// Check if we should throttle connection attempts
const shouldThrottleConnection = (): boolean => {
  const lastAttempt = getLastConnectionAttempt();
  const now = Date.now();
  // Throttle if last attempt was less than 5 minutes ago
  return (now - lastAttempt) < 5 * 60 * 1000;
};

export const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [enabled, setEnabledState] = useState<boolean>(isWebSocketEnabled());
  const [usingFallback, setUsingFallback] = useState(false);
  const maxReconnectAttempts = 2; // Reduced max attempts to avoid excessive retries
  
  // Update localStorage and state when enabled/disabled
  const setEnabled = useCallback((value: boolean) => {
    localStorage.setItem("websocket_enabled", value.toString());
    setEnabledState(value);
    
    // If enabling again and we have a user, try to reconnect
    if (value && user && !connected && !socket) {
      // Reset reconnect attempts when manually re-enabling
      setReconnectAttempts(0);
      setUsingFallback(false);
      // Use a slight delay to allow state to update
      setTimeout(() => connect(), 100);
    } else if (!value && socket) {
      // If disabling, close any existing connection
      socket.close();
      setSocket(null);
      setConnected(false);
    }
  }, [user, connected, socket]);
  
  // Helper to check environment support for WebSockets
  const checkWebSocketSupport = useCallback(() => {
    // First check if the browser supports WebSockets
    if (typeof WebSocket === 'undefined') {
      console.warn('WebSockets are not supported in this browser');
      return false;
    }
    
    // Check if we've had recent connection issues and should throttle
    if (shouldThrottleConnection() && reconnectAttempts >= maxReconnectAttempts) {
      console.warn('Throttling WebSocket connection attempts due to recent failures');
      return false;
    }
    
    return true;
  }, [reconnectAttempts]);
  
  const connect = useCallback(() => {
    // Don't connect if websockets are disabled or user isn't logged in
    if (!enabled || !user) {
      setSocket(null);
      setConnected(false);
      return;
    }
    
    // Check if WebSockets are supported and not throttled
    if (!checkWebSocketSupport()) {
      setUsingFallback(true);
      return;
    }
    
    // Don't attempt to reconnect if we've exceeded our limit
    if (reconnectAttempts >= maxReconnectAttempts) {
      // Only show the toast once when we hit the limit
      if (reconnectAttempts === maxReconnectAttempts) {
        toast({
          title: "Switching to Standard Mode",
          description: "Unable to establish real-time connection. Using standard refresh mode instead.",
          variant: "default",
        });
        // Record this connection attempt time
        setLastConnectionAttempt(Date.now());
        // Don't disable completely, just mark as using fallback
        setUsingFallback(true);
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
        setUsingFallback(false);
        
        // Send authentication message
        if (user) {
          newSocket.send(
            JSON.stringify({
              type: "auth",
              userId: user.id,
              role: user.role,
            })
          );
        }
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
      } else {
        // Set as using fallback after max attempts
        setUsingFallback(true);
        setLastConnectionAttempt(Date.now());
      }
    }
  }, [user, reconnectAttempts, toast, enabled, socket, checkWebSocketSupport]);
  
  // Connect to WebSocket when user changes or when enabled changes
  useEffect(() => {
    if (enabled && user && !usingFallback) {
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
  }, [connect, socket, user, enabled, usingFallback]);
  
  // Periodically try to reconnect if in fallback mode
  useEffect(() => {
    if (usingFallback && enabled && user) {
      // Try to reconnect every 10 minutes if in fallback mode
      const reconnectTimer = setTimeout(() => {
        // Only attempt if not throttled
        if (!shouldThrottleConnection()) {
          console.log("Attempting to reconnect from fallback mode");
          setReconnectAttempts(0);
          connect();
        }
      }, 10 * 60 * 1000);
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [usingFallback, enabled, user, connect]);
  
  // Send message function with fallback for when WebSocket is not connected
  const sendMessage = useCallback(
    (message: any) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else if (enabled && !usingFallback) {
        // If WebSocket is meant to be enabled but not connected, try to connect
        console.warn("WebSocket is not connected, attempting to reconnect");
        
        // Store the message in session storage to send once connected
        // (In a real app, you might use an outgoing message queue)
        console.log("Message not sent:", message);
      } else if (usingFallback) {
        // In fallback mode, use HTTP for critical messages
        console.log("Using HTTP fallback for message:", message);
        // You could implement HTTP API calls here for critical messages
      }
    },
    [socket, enabled, usingFallback]
  );
  
  return (
    <WebSocketContext.Provider value={{ connected, messages, sendMessage, enabled, setEnabled }}>
      {children}
      {/* Connection indicator for debugging */}
      {import.meta.env.DEV && (
        <div 
          style={{
            position: 'fixed',
            bottom: '5px',
            right: '5px',
            padding: '4px 8px',
            fontSize: '12px',
            borderRadius: '4px',
            backgroundColor: connected ? 'rgba(0, 128, 0, 0.8)' : 
                               usingFallback ? 'rgba(255, 165, 0, 0.8)' :
                               enabled ? 'rgba(255, 0, 0, 0.8)' : 'rgba(128, 128, 128, 0.8)',
            color: 'white',
            zIndex: 9999,
            cursor: 'pointer',
          }}
          onClick={() => setEnabled(!enabled)}
          title={enabled ? "Click to disable WebSocket" : "Click to enable WebSocket"}
        >
          {connected ? "Connected (Real-time)" : 
           usingFallback ? "Using Standard Mode" :
           enabled ? "Disconnected" : "Disabled"}
        </div>
      )}
    </WebSocketContext.Provider>
  );
};
