import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import ConnectionStatus from "../notifications/ConnectionStatus";
import { ThemeSwitch } from "../ui/theme-switch";
import { useLocation } from "wouter";
import ProfileMenu from "./ProfileMenu";
import { CuralinkLogo } from "../ui/CuralinkLogo";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  if (!user) {
    // Use useEffect for navigation to avoid React state update during render
    useEffect(() => {
      setLocation("/login");
    }, [setLocation]);
    
    // Return a loading state instead of null
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-blue-600/30 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <p className="text-xl font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  const isDoctor = user.role === "doctor";
  
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    // Handle navigation based on tabName
    if (tabName === "dashboard") {
      setLocation("/dashboard");
    } else if (tabName === "appointments") {
      setLocation("/appointments");
    } else if (tabName === "profile") {
      setLocation("/profile");
    } else if (tabName === "video") {
      setLocation("/video-call");
    } else if (tabName === "emergency") {
      setLocation("/emergency");
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-white text-black dark:bg-black dark:text-white">
      {/* Header */}
      <header className="bg-white border-gray-200 dark:bg-black dark:border-gray-800 shadow-lg border-b fixed top-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CuralinkLogo size={32} variant="default" className="mr-3" />
              <h1 className="text-lg font-medium text-black dark:text-white">Curalink</h1>
              {isDoctor && (
                <span className="ml-3 text-xs font-medium py-1 px-3 bg-blue-900/50 text-blue-400 rounded-full border border-blue-800/50">
                  Doctor
                </span>
              )}
            </div>
            <div className="flex items-center space-x-5">
              <ThemeSwitch />
              <ConnectionStatus />
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow bg-white dark:bg-black pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
