import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Pill, 
  UserSearch, 
  CalendarDays, 
  Ambulance, 
  Menu, 
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SideNavigationProps {
  activeTab: string;
  onTabChange: (tabName: string) => void;
}

export default function SideNavigation({ activeTab, onTabChange }: SideNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleTabChange = (tabName: string) => {
    onTabChange(tabName);
    setIsOpen(false);
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
      {/* Mobile Menu Toggle Button */}
      <div className="md:hidden fixed top-4 right-4 z-40">
        <button 
          onClick={toggleMenu}
          className="p-2 rounded-full bg-gray-800 text-white shadow-lg border border-gray-700"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Side Navigation - Desktop */}
      <div className="hidden md:flex flex-col h-screen w-64 bg-gray-900 border-r border-gray-800 fixed left-0 top-0 pt-8 px-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-8 px-4">AI Health Bridge</h2>
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
        "md:hidden fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "fixed top-0 left-0 bottom-0 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out z-40",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="pt-12 px-4">
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