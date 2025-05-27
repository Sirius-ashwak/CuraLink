import { createContext, ReactNode, useState, useEffect } from "react";
import { User } from "@shared/schema";
import { isStaticMode } from "@/config/staticSiteConfig";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  isStaticSite: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  login: async () => null,
  register: async () => null,
  logout: () => {},
  isStaticSite: false
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const staticSite = isStaticMode();
  
  useEffect(() => {
    // Check if we have a user in local storage
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    
    setIsLoading(false);
  }, []);
  
  // Persist user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);
  
  // Login function
  const login = async (email: string, password: string) => {
    if (staticSite) {
      // Static site authentication simulation
      if (email === "patient@example.com" && password === "password") {
        const staticUser = {
          id: 1,
          email: "patient@example.com",
          name: "Sample Patient",
          role: "patient",
          createdAt: new Date().toISOString()
        };
        setUser(staticUser);
        return staticUser;
      } else if (email === "doctor@example.com" && password === "password") {
        const staticDoctor = {
          id: 2,
          email: "doctor@example.com",
          name: "Dr. Jane Smith",
          role: "doctor",
          specialty: "General Medicine",
          createdAt: new Date().toISOString(),
          doctorInfo: {
            id: 1,
            userId: 2,
            specialty: "General Medicine",
            averageRating: 4.8,
            reviewCount: 125,
            isAvailable: true
          }
        };
        setUser(staticDoctor);
        return staticDoctor;
      } else {
        throw new Error("Invalid credentials");
      }
    } else {
      // Regular API authentication
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Login failed");
        }
        
        const userData = await response.json();
        setUser(userData);
        return userData;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    }
  };
  
  // Register function
  const register = async (userData: any) => {
    if (staticSite) {
      // Static site registration simulation
      const newUser = {
        ...userData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      };
      setUser(newUser);
      return newUser;
    } else {
      // Regular API registration
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Registration failed");
        }
        
        const newUser = await response.json();
        setUser(newUser);
        return newUser;
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    }
  };
  
  // Logout function
  const logout = () => {
    setUser(null);
    
    if (!staticSite) {
      // Call logout API in non-static mode
      fetch("/api/auth/logout", {
        method: "POST",
      }).catch(console.error);
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        setUser, 
        isLoading, 
        login, 
        register, 
        logout,
        isStaticSite: staticSite
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
