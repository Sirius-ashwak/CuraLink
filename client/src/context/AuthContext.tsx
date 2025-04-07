import { createContext, ReactNode, useState, useEffect } from "react";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication...");
        const token = localStorage.getItem("token");
        
        // Initialize from localStorage if available (for faster initial render)
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("Found user in localStorage:", parsedUser.email);
            setUser(parsedUser);
          } catch (e) {
            console.error("Failed to parse stored user:", e);
            localStorage.removeItem("user");
          }
        }
        
        // Then validate with the server
        if (token) {
          console.log("Found token, validating with server...");
          
          try {
            const response = await fetch('/api/auth/validate', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              console.log("Auth validation successful:", userData.email);
              setUser(userData);
              // Update localStorage with fresh data
              localStorage.setItem("user", JSON.stringify(userData));
            } else {
              console.error("Auth validation failed with status:", response.status);
              const errorData = await response.json().catch(() => ({}));
              console.error("Error details:", errorData);
              
              // Clear invalid auth data
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setUser(null);
            }
          } catch (fetchError) {
            console.error("Fetch error during auth validation:", fetchError);
            // Don't clear token on network errors - might be temporary
          }
        } else {
          console.log("No token found, user is not authenticated");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth checking process failed:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
