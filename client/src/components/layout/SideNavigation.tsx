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
import { CuralinkLogo } from '@/components/ui/CuralinkLogo';

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
      icon: <LayoutDashboard className="h-4.5 w-4.5" />,
      colorClass: 'text-indigo-400'
    },
    { 
      id: 'ai-chat', 
      label: 'AI Companion', 
      icon: <Bot className="h-4.5 w-4.5" />,
      colorClass: 'text-blue-400'
    },
    { 
      id: 'medicine-tracker', 
      label: 'Medicine Tracker',
      icon: <Pill className="h-4.5 w-4.5" />,
      colorClass: 'text-purple-400'
    },
    { 
      id: 'doctor-matcher', 
      label: 'Doctor Matcher', 
      icon: <UserSearch className="h-4.5 w-4.5" />,
      colorClass: 'text-cyan-400'
    },
    { 
      id: 'appointments', 
      label: 'Appointments', 
      icon: <CalendarDays className="h-4.5 w-4.5" />,
      colorClass: 'text-violet-400'
    },
    { 
      id: 'emergency-transport', 
      label: 'Emergency Transport', 
      icon: <Ambulance className="h-4.5 w-4.5" />,
      colorClass: 'text-rose-400'
    }
  ];

  return (
    <>
      {/* Navigation Menu Button - Positioned to fit with header layout */}
      <div className="fixed top-3.5 right-20 lg:right-24 z-50">
        <Button 
          ref={dotsRef}
          variant="outline" 
          size="icon" 
          className="h-9 w-9 rounded-full border-indigo-700/30 text-indigo-300 hover:text-white hover:bg-indigo-800/50 hover:border-indigo-600/50 transition-colors shadow-[0_0_10px_rgba(79,70,229,0.3)]"
          onClick={toggleMenu}
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Semi-transparent overlay behind the menu */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-300 ease-in-out z-30",
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
          "fixed inset-y-0 right-0 w-72 bg-gradient-to-b from-gray-900/95 via-gray-900/95 to-gray-950/95 backdrop-blur-lg border-l border-indigo-900/30 shadow-2xl shadow-indigo-900/20 transform transition-all duration-300 ease-in-out z-40 overflow-hidden",
          isMenuOpen 
            ? "translate-x-0" 
            : "translate-x-full"
        )}
      >
        {/* Menu Header with close button */}
        <div className="py-4 px-5 border-b border-indigo-900/30 bg-gradient-to-r from-indigo-900/20 via-gray-900/40 to-gray-900/20 flex items-center justify-between">
          <h3 className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-blue-200">Navigation Menu</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-indigo-900/20 transition-colors"
            onClick={toggleMenu}
          >
            <X className="h-4 w-4 text-indigo-300" />
          </Button>
        </div>
        
        {/* Menu Items */}
        <div className="p-5 pt-7">
          <div className="space-y-2.5">
            {navItems.map(item => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
                  activeTab === item.id 
                    ? "bg-gradient-to-r from-indigo-900/30 to-indigo-950/40 text-white border border-indigo-700/20 shadow-[0_2px_10px_rgba(79,70,229,0.15)]" 
                    : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                )}
                onClick={() => handleTabChange(item.id)}
              >
                <div className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-lg mr-3 transition-all duration-200", 
                  activeTab === item.id 
                    ? `${item.colorClass} bg-gray-900 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]` 
                    : "bg-gray-800/50"
                )}>
                  {item.icon}
                </div>
                <span className={cn(
                  "font-medium text-sm",
                  activeTab === item.id && "bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 to-blue-200"
                )}>
                  {item.label}
                </span>
                {activeTab === item.id && (
                  <ArrowRight className="h-3.5 w-3.5 ml-auto text-indigo-300" />
                )}
              </div>
            ))}
          </div>
          
          {/* Decorative Element */}
          <div className="mt-10 p-5 bg-gradient-to-br from-indigo-900/20 via-indigo-950/20 to-gray-900/20 border border-indigo-800/30 rounded-xl shadow-inner">
            <div className="flex items-center text-indigo-200 text-sm">
              <CuralinkLogo size={24} variant="simple" className="mr-3" />
              <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 to-blue-200">Curalink</span>
            </div>
            <p className="text-xs text-indigo-300/70 mt-3 leading-relaxed">
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