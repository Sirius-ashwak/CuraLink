import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader,
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogOut, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function Logout() {
  const { user, setUser } = useAuth();
  const [location, setLocation] = useLocation();
  
  const handleLogout = () => {
    // Clear user from context
    setUser(null);
    // Redirect to login page
    setLocation('/login');
  };
  
  const handleCancel = () => {
    // Return to dashboard
    setLocation('/dashboard');
  };
  
  // If user is already logged out, redirect to login
  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);
  
  if (!user) return null; // Prevent flash of content during redirect
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950 p-4">
      <Card className="w-full max-w-md mx-auto bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border border-indigo-900/30 shadow-2xl overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
        
        <CardHeader className="relative z-10">
          <div className="w-12 h-12 rounded-full mx-auto bg-red-900/20 border border-red-800/50 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle className="text-xl text-center">Confirm Logout</CardTitle>
          <CardDescription className="text-center">
            Are you sure you want to log out of your account?
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center pb-2 relative z-10">
          <p className="text-gray-400">
            You will need to log in again to access your health data and appointments.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3 pt-2 relative z-10">
          <Button 
            onClick={handleLogout} 
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Yes, Log Me Out
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="w-full border-gray-700 text-gray-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel, Return to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}