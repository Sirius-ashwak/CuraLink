import { useState } from "react";
import { Heart, Activity, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function WelcomeScreen() {
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Demo account credentials
  const demoPatient = {
    email: "john@example.com",
    password: "password123",
  };

  // Handle guest login with the demo patient account
  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        email: demoPatient.email,
        password: demoPatient.password,
        role: "patient"
      });

      const userData = await response.json();
      setUser(userData);
      setLocation("/dashboard");
      
      toast({
        title: "Guest login successful",
        description: `Welcome, ${userData.firstName}!`,
      });
    } catch (error) {
      console.error("Guest login failed:", error);
      toast({
        title: "Guest login failed",
        description: "Could not log in as guest. Please try again or create an account.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    setLocation("/register");
  };

  const handleSignIn = () => {
    setLocation("/login");
  };

  return (
    <div className="w-full max-w-md px-6 py-8 flex flex-col h-full text-white">
      <h1 className="text-3xl font-bold mb-10 mt-12">Welcome to AI Health Bridge</h1>
      
      <div className="space-y-6 flex-1">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-500 p-3 rounded-full">
            <Activity className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="font-medium text-lg text-white">Monitor Your Health</h3>
            <p className="text-gray-400 text-sm">Track your health metrics, appointments, and medical history.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="bg-blue-500 p-3 rounded-full">
            <Heart className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="font-medium text-lg text-white">AI Symptom Checker</h3>
            <p className="text-gray-400 text-sm">Get preliminary health advice from our advanced AI assistant.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="bg-blue-500 p-3 rounded-full">
            <Users className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 className="font-medium text-lg text-white">Connect With Doctors</h3>
            <p className="text-gray-400 text-sm">Find and consult with healthcare providers in real-time.</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 mt-10 pb-4">
        <Button 
          className="w-full py-6 bg-blue-500 hover:bg-blue-600 text-black font-medium text-lg rounded-xl"
          onClick={handleSignIn}
          disabled={isLoading}
        >
          Sign In
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full py-6 border-blue-500 text-blue-500 hover:bg-blue-900/20 font-medium text-lg rounded-xl"
          onClick={handleRegister}
          disabled={isLoading}
        >
          Create Account
        </Button>
        
        <Button 
          variant="ghost"
          onClick={handleGuestLogin} 
          className="text-blue-500 hover:text-blue-400 hover:bg-blue-900/10 text-sm font-medium mt-4 w-full text-center py-2"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Continue as guest"}
        </Button>
      </div>
    </div>
  );
}