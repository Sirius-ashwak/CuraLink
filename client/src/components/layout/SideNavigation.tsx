import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Pill, 
  UserSearch, 
  CalendarDays, 
  Ambulance, 
  MoreVertical, 
  ArrowRight,
  X
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
      {/* Navigation Menu Button - Now positioned in top right */}
      <div className="fixed top-3 right-4 z-50">
        <Button 
          ref={dotsRef}
          variant="outline" 
          size="icon" 
          className="h-9 w-9 rounded-full border-blue-700/30 text-blue-400 hover:text-white hover:bg-blue-800/50 hover:border-blue-600/50 transition-colors shadow-md"
          onClick={toggleMenu}
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Semi-transparent overlay behind the menu */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-30",
          isMenuOpen 
            ? "opacity-100" 
            : "opacity-0 pointer-events-none"
        )}
        onClick={toggleMenu}
      />
      
      {/* Improved slide-in menu with transition animation */}
      <div 
        ref={menuRef}
        className={cn(
          "fixed inset-y-0 right-0 w-72 bg-gray-900/95 backdrop-blur-lg border-l border-blue-800/20 shadow-lg shadow-blue-900/10 transform transition-all duration-300 ease-in-out z-40 overflow-hidden",
          isMenuOpen 
            ? "translate-x-0" 
            : "translate-x-full"
        )}
      >
        {/* Menu Header with close button */}
        <div className="py-4 px-5 border-b border-gray-800/50 flex items-center justify-between">
          <h3 className="text-sm font-medium text-blue-100">Navigation Menu</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-gray-800"
            onClick={toggleMenu}
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        </div>
        
        {/* Menu Items */}
        <div className="p-4 pt-6">
          <div className="space-y-2.5">
            {navItems.map(item => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all",
                  activeTab === item.id 
                    ? "bg-blue-600/20 text-white" 
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
                onClick={() => handleTabChange(item.id)}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-md mr-3", 
                  activeTab === item.id 
                    ? `${item.colorClass} bg-gray-800/80 border border-blue-500/30` 
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
          
          {/* Decorative Element */}
          <div className="mt-8 p-4 bg-blue-800/10 border border-blue-800/20 rounded-lg">
            <div className="flex items-center text-blue-300 text-sm">
              <div className="mr-2 p-1.5 bg-blue-800/30 rounded-md">
                <Bot className="h-4 w-4" />
              </div>
              <span className="font-medium">AI Health Bridge</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Your health assistant is always ready to help with any questions or concerns.
            </p>
          </div>
        </div>
      </div>

      {/* Removed Side Navigation for Desktop - Now using three dots menu instead */}

      {/* Using the three dots menu for all devices - removed mobile side navigation */}
    </>
  );
}