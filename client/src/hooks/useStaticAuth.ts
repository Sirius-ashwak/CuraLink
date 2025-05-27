import { useState, useEffect } from 'react';
import { staticSiteConfig, isStaticMode } from '../config/staticSiteConfig';

/**
 * Hook for static site authentication
 * 
 * Provides basic authentication functionality for static site deployments
 * using localStorage to persist the user state.
 */
export const useStaticAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Load user on mount
  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem('static_user');
      
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse user from localStorage');
          localStorage.removeItem('static_user');
        }
      }
      
      setLoading(false);
    };
    
    loadUser();
  }, []);
  
  // Static login function
  const login = async (email: string, password: string) => {
    // In a static site, we're not actually authenticating against a server
    // Instead, we'll simulate a login with sample data
    
    if (email === 'patient@example.com' && password === 'password') {
      // Patient login
      setUser(staticSiteConfig.sampleUser);
      localStorage.setItem('static_user', JSON.stringify(staticSiteConfig.sampleUser));
      return staticSiteConfig.sampleUser;
    } else if (email === 'doctor@example.com' && password === 'password') {
      // Doctor login
      const doctorUser = {
        ...staticSiteConfig.sampleDoctor.user,
        doctorInfo: staticSiteConfig.sampleDoctor
      };
      setUser(doctorUser);
      localStorage.setItem('static_user', JSON.stringify(doctorUser));
      return doctorUser;
    } else {
      throw new Error('Invalid credentials');
    }
  };
  
  // Static register function
  const register = async (userData: any) => {
    // Simulate user registration in static mode
    const newUser = {
      ...userData,
      id: Date.now(), // Generate a random ID
      createdAt: new Date()
    };
    
    setUser(newUser);
    localStorage.setItem('static_user', JSON.stringify(newUser));
    return newUser;
  };
  
  // Static logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('static_user');
  };
  
  return {
    user,
    loading,
    login,
    register,
    logout,
    isStaticMode: isStaticMode()
  };
};