import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import PatientNavigation from "./PatientNavigation";
import DoctorNavigation from "./DoctorNavigation";
import ConnectionStatus from "../notifications/ConnectionStatus";
import { ThemeSwitch } from "../ui/theme-switch";
import { useLocation } from "wouter";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  if (!user) {
    setLocation("/");
    return null;
  }
  
  const isDoctor = user.role === "doctor";
  const firstLetters = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  
  return (
    <div className="flex flex-col min-h-screen bg-white text-black dark:bg-black dark:text-white">
      {/* Header */}
      <header className="bg-white border-gray-200 dark:bg-black dark:border-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="material-icons text-blue-500 mr-2">health_and_safety</span>
              <h1 className="text-lg font-medium text-black dark:text-white">AI Health Bridge</h1>
              {isDoctor && (
                <span className="ml-2 text-xs font-medium py-1 px-2 bg-blue-900 text-blue-300 rounded-full">
                  Doctor
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSwitch />
              <ConnectionStatus />
              <div className={`w-8 h-8 rounded-full ${isDoctor ? 'bg-blue-500' : 'bg-blue-700'} flex items-center justify-center`}>
                <span className="text-sm font-medium text-white">{firstLetters}</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      {/* Mobile Navigation */}
      {isDoctor ? <DoctorNavigation /> : <PatientNavigation />}
    </div>
  );
}
