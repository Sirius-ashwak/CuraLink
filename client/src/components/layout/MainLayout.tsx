import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import SideNavigation from "./SideNavigation";
import ConnectionStatus from "../notifications/ConnectionStatus";
import { ThemeSwitch } from "../ui/theme-switch";
import { useLocation } from "wouter";
import ProfileMenu from "./ProfileMenu";
import { useState } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  if (!user) {
    setLocation("/");
    return null;
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
              <div className="flex items-center justify-center h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg mr-3 shadow-md">
                <span className="text-white font-bold text-lg">+</span>
              </div>
              <h1 className="text-lg font-medium text-black dark:text-white">AI Health Bridge</h1>
              {isDoctor && (
                <span className="ml-3 text-xs font-medium py-1 px-3 bg-blue-900/50 text-blue-400 rounded-full border border-blue-800/50">
                  Doctor
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <div className="hidden sm:flex items-center space-x-2 mr-2">
                <ThemeSwitch />
                <ConnectionStatus />
              </div>
              <ProfileMenu />
              <SideNavigation activeTab={activeTab} onTabChange={handleTabChange} />
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
