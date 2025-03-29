import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import LoginForm from "@/components/auth/LoginForm";

export default function Login() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500 mb-4">
            <span className="material-icons text-black text-2xl">health_and_safety</span>
          </div>
          <h3 className="text-lg font-medium text-white mb-1">AI Health Bridge</h3>
          <p className="text-gray-400">Loading your healthcare portal...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    return null; // Will redirect in the useEffect
  }
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center px-6">
      <LoginForm />
    </div>
  );
}
