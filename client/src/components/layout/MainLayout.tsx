import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import ConnectionStatus from "../notifications/ConnectionStatus";
import { ThemeSwitch } from "../ui/theme-switch";
import { useLocation } from "wouter";
import ProfileMenu from "./ProfileMenu";
import { useState } from "react";
import { CuralinkLogo } from "../ui/CuralinkLogo";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  if (!user) {
    setLocation("/");
    return null;
  }
  
  const isDoctor = user.role === "doctor";
  
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    setMobileMenuOpen(false); // Close mobile menu when navigating
    
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
  
  // Navigation items for mobile bottom bar and desktop header
  const navItems = [
    { name: "Dashboard", key: "dashboard", path: "/dashboard" },
    { name: "Appointments", key: "appointments", path: "/appointments" },
    { name: "Profile", key: "profile", path: "/profile" },
    { name: "Video Call", key: "video", path: "/video-call" },
    { name: "Emergency", key: "emergency", path: "/emergency" }
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-white text-black dark:bg-black dark:text-white">
      {/* Header - Responsive for all devices */}
      <header className="bg-white border-gray-200 dark:bg-black dark:border-gray-800 shadow-lg border-b fixed top-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Title - Simplified on mobile */}
            <div className="flex items-center">
              <CuralinkLogo size={28} variant="default" className="mr-2 sm:mr-3" />
              <h1 className="text-base sm:text-lg font-medium text-black dark:text-white">Curalink</h1>
              {isDoctor && (
                <span className="ml-2 text-xs font-medium py-0.5 px-2 sm:py-1 sm:px-3 bg-blue-900/50 text-blue-400 rounded-full border border-blue-800/50">
                  Doctor
                </span>
              )}
            </div>
            
            {/* Right side menu items - Optimized for mobile */}
            <div className="flex items-center space-x-2 sm:space-x-5">
              <ThemeSwitch />
              
              {/* Only show connection status on larger screens */}
              <div className="hidden sm:block">
                <ConnectionStatus />
              </div>
              
              <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
              
              {/* Menu button for mobile */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
              
              {/* Profile menu always visible */}
              <ProfileMenu />
            </div>
          </div>
          
          {/* Mobile navigation menu - slide down when open */}
          <div className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-64' : 'max-h-0'}`}>
            <nav className="py-3 space-y-1 border-t border-gray-200 dark:border-gray-800">
              {navItems.map(item => (
                <button
                  key={item.key}
                  onClick={() => handleTabChange(item.key)}
                  className={`w-full text-left px-4 py-2 flex items-center text-sm font-medium rounded-md ${
                    activeTab === item.key 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main Content - Responsive padding and spacing */}
      <main className="flex-grow bg-white dark:bg-black pt-16 sm:pt-20 pb-16 sm:pb-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 fixed bottom-0 left-0 right-0 z-30">
        <div className="grid grid-cols-5 h-16">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className={`flex flex-col items-center justify-center text-xs font-medium ${
                activeTab === item.key 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className={`w-6 h-6 mb-1 flex items-center justify-center rounded-full ${
                activeTab === item.key ? 'bg-blue-100 dark:bg-blue-900/40' : ''
              }`}>
                {/* Simple circle indicator for active tab */}
                {activeTab === item.key && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                )}
              </div>
              <span>{item.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
