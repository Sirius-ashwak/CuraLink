import { Heart, Activity, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function WelcomeScreen() {
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();

  // Sample user for auto-login (remove in production)
  const handleGuestLogin = () => {
    setUser({
      id: 1,
      email: "guest@example.com",
      password: "guest123",  // Note: This is just for the demo
      firstName: "Guest",
      lastName: "User",
      role: "patient",
      specialty: null,
      profile: null,
      createdAt: new Date(),
    });
    setLocation("/dashboard");
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
          onClick={() => setLocation("/login")}
        >
          Sign In
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full py-6 border-blue-500 text-blue-500 hover:bg-blue-900/20 font-medium text-lg rounded-xl"
          onClick={() => setLocation("/register")}
        >
          Create Account
        </Button>
        
        <button 
          onClick={handleGuestLogin} 
          className="text-blue-500 hover:text-blue-400 text-sm font-medium mt-4 w-full text-center"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}