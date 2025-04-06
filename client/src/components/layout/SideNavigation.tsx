import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Pill, 
  UserSearch, 
  CalendarDays, 
  Ambulance, 
  MoreVertical, 
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SideNavigationProps {
  activeTab: string;
  onTabChange: (tabName: string) => void;
}

export default function SideNavigation({ activeTab, onTabChange }: SideNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLButtonElement>(null);
  
  // Handle clicks outside the menu to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isMenuOpen && 
          menuRef.current && 
          dotsRef.current && 
          !menuRef.current.contains(event.target as Node) && 
          !dotsRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleTabChange = (tabName: string) => {
    onTabChange(tabName);
    setIsMenuOpen(false);
  };

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="h-4 w-4" />,
      colorClass: 'text-blue-500'
    },
    { 
      id: 'ai-chat', 
      label: 'AI Companion', 
      icon: <Bot className="h-4 w-4" />,
      colorClass: 'text-purple-500'
    },
    { 
      id: 'medicine-tracker', 
      label: 'Medicine Tracker',
      icon: <Pill className="h-4 w-4" />,
      colorClass: 'text-green-500'
    },
    { 
      id: 'doctor-matcher', 
      label: 'Doctor Matcher', 
      icon: <UserSearch className="h-4 w-4" />,
      colorClass: 'text-sky-500'
    },
    { 
      id: 'appointments', 
      label: 'Appointments', 
      icon: <CalendarDays className="h-4 w-4" />,
      colorClass: 'text-indigo-500'
    },
    { 
      id: 'emergency-transport', 
      label: 'Emergency Transport', 
      icon: <Ambulance className="h-4 w-4" />,
      colorClass: 'text-red-500'
    }
  ];

  return (
    <>
      {/* Compact Navigation Menu Button */}
      <Button 
        ref={dotsRef}
        variant="ghost" 
        size="icon" 
        className="ml-1 h-8 w-8 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={toggleMenu}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {/* Apple-style Slide-in Menu Panel */}
      <div 
        ref={menuRef}
        className={cn(
          "fixed right-4 top-16 w-64 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-blue-800/20 shadow-lg shadow-blue-900/10 transform transition-all duration-300 ease-in-out z-40 overflow-hidden",
          isMenuOpen 
            ? "translate-y-0 opacity-100" 
            : "translate-y-4 opacity-0 pointer-events-none"
        )}
      >
        {/* Menu Header */}
        <div className="py-3 px-4 border-b border-gray-800/50">
          <h3 className="text-sm font-medium text-gray-200">Navigation</h3>
        </div>
        
        {/* Menu Items */}
        <div className="p-2">
          <div className="space-y-1 py-1">
            {navItems.map(item => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md cursor-pointer transition-all",
                  activeTab === item.id 
                    ? "bg-blue-600/20 text-white" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
                onClick={() => handleTabChange(item.id)}
              >
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 rounded-md mr-3", 
                  activeTab === item.id 
                    ? `${item.colorClass} bg-gray-800/80` 
                    : "bg-gray-800/50"
                )}>
                  {item.icon}
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                {activeTab === item.id && (
                  <ArrowRight className="h-3 w-3 ml-auto text-blue-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Removed Side Navigation for Desktop - Now using three dots menu instead */}

      {/* Using the three dots menu for all devices - removed mobile side navigation */}
    </>
  );
}