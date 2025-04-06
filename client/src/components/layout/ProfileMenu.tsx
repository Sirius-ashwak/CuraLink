import React, { useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  User, 
  Settings, 
  LogOut,
  Bell,
  LayoutDashboard, 
  Bot, 
  Pill, 
  UserSearch, 
  CalendarDays, 
  Ambulance,
  Video
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';

export default function ProfileMenu() {
  const { user, setUser } = useAuth();
  const [location, setLocation] = useLocation();
  
  if (!user) return null;
  
  const firstLetters = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  const isDoctor = user.role === "doctor";
  
  const handleLogout = () => {
    // Clear user from context
    setUser(null);
    // Redirect to login page
    setLocation('/login');
  };
  
  const handleProfileClick = () => {
    setLocation('/profile');
  };
  
  const handleSettingsClick = () => {
    setLocation('/settings');
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Avatar className={`h-9 w-9 ${isDoctor ? 'bg-blue-500' : 'bg-blue-700'}`}>
            <AvatarFallback className="text-white">{firstLetters}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Navigation Menu Items */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4 text-blue-500" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
            <Bot className="mr-2 h-4 w-4 text-purple-500" />
            <span>AI Companion</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
            <Pill className="mr-2 h-4 w-4 text-green-500" />
            <span>Medicine Tracker</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
            <UserSearch className="mr-2 h-4 w-4 text-sky-500" />
            <span>Doctor Matcher</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
            <CalendarDays className="mr-2 h-4 w-4 text-indigo-500" />
            <span>Appointments</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setLocation('/dashboard')}>
            <Ambulance className="mr-2 h-4 w-4 text-red-500" />
            <span>Emergency Transport</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setLocation('/video-call')}>
            <Video className="mr-2 h-4 w-4 text-yellow-500" />
            <span>Video Consultation</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* User Settings */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleProfileClick}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSettingsClick}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}