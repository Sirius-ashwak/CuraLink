import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useLocation } from "wouter";

export function useAuth() {
  const { user, setUser, isLoading } = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Login function with improved error handling
  const login = async (email: string, password: string) => {
    setIsAuthenticating(true);
    setLoginError(null);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const userData = await response.json();
      
      // Set user in context
      setUser(userData);
      
      // Save token if provided
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
      
      // Log success for debugging
      console.log("Login successful", userData);
      
      // Redirect based on user role
      if (userData.role === 'patient') {
        setLocation('/dashboard');
      } else if (userData.role === 'doctor') {
        setLocation('/dashboard');
      } else {
        console.warn("Unknown user role:", userData.role);
        setLocation('/dashboard');
      }
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error instanceof Error ? error.message : 'An unexpected error occurred');
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setLocation('/login');
  };
  
  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  return {
    user,
    setUser,
    isLoading,
    login,
    logout,
    isAuthenticated,
    loginError,
    isAuthenticating
  };
}
