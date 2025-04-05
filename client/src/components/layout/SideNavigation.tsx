import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Pill, 
  UserSearch, 
  CalendarDays, 
  Ambulance, 
  Menu, 
  X,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import ProfileMenu from './ProfileMenu';

interface SideNavigationProps {
  activeTab: string;
  onTabChange: (tabName: string) => void;
}

export default function SideNavigation({ activeTab, onTabChange }: SideNavigationProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleTabChange = (tabName: string) => {
    onTabChange(tabName);
    setIsMobileSidebarOpen(false);
  };

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" />,
      colorClass: 'text-blue-500'
    },
    { 
      id: 'ai-chat', 
      label: 'AI Companion', 
      icon: <Bot className="h-5 w-5" />,
      colorClass: 'text-purple-500'
    },
    { 
      id: 'medicine-tracker', 
      label: 'Medicine Tracker',

      icon: <Pill className="h-5 w-5" />,
      colorClass: 'text-green-500'
    },
    { 
      id: 'doctor-matcher', 
      label: 'Doctor Matcher', 
      icon: <UserSearch className="h-5 w-5" />,
      colorClass: 'text-sky-500'
    },
    { 
      id: 'appointments', 
      label: 'Appointments', 
      icon: <CalendarDays className="h-5 w-5" />,
      colorClass: 'text-indigo-500'
    },
    { 
      id: 'emergency-transport', 
      label: 'Emergency Transport', 
      icon: <Ambulance className="h-5 w-5" />,
      colorClass: 'text-red-500'
    }
  ];

  return (
    <>
      {/* Top Navigation Bar (Mobile & Desktop) */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-30">
        {/* Logo / Home button */}
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => handleTabChange('dashboard')}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mr-3">
            <Home className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">AI Health Bridge</h2>
        </div>

        {/* Menu Actions */}
        <div className="flex items-center">
          {/* Profile Menu */}
          <ProfileMenu />

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden ml-2">
            <Button 
              variant="ghost"
              size="icon"
              onClick={toggleMobileSidebar}
              className="h-9 w-9 rounded-full text-gray-400 hover:text-white"
            >
              {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Side Navigation - Desktop */}
      <div className="hidden md:flex flex-col h-screen w-64 bg-gray-900 border-r border-gray-800 fixed left-0 top-16 pt-6 px-4 overflow-y-auto">
        <nav className="space-y-1 flex-1">
          {navItems.map(item => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start mb-1 px-4 py-2", 
                activeTab === item.id 
                  ? "bg-gray-800 text-white font-medium hover:bg-gray-700" 
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
              onClick={() => handleTabChange(item.id)}
            >
              <span className={cn("mr-3", item.colorClass)}>{item.icon}</span>
              {item.label}
            </Button>
          ))}
        </nav>
      </div>

      {/* Mobile Side Navigation */}
      <div className={cn(
        "md:hidden fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity",
        isMobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "fixed top-16 left-0 bottom-0 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out z-30",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="pt-4 px-4">
            <nav className="space-y-1">
              {navItems.map(item => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start mb-1 px-4 py-2", 
                    activeTab === item.id 
                      ? "bg-gray-800 text-white font-medium hover:bg-gray-700" 
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  )}
                  onClick={() => handleTabChange(item.id)}
                >
                  <span className={cn("mr-3", item.colorClass)}>{item.icon}</span>
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}