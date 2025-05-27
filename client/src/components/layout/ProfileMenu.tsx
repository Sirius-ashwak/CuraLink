import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  User, 
  Settings, 
  LogOut,
  Bell
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';

export default function ProfileMenu() {
  const { user, setUser } = useAuth();
  const [location, setLocation] = useLocation();
  
  if (!user) return null;
  
  const firstLetters = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`;
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
        
        {/* User Settings - Only these options as requested */}
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleProfileClick} className="flex items-center">
            <div className="mr-2 w-5 h-5 flex items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900">
              <User className="h-3.5 w-3.5 text-blue-700 dark:text-blue-300" />
            </div>
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSettingsClick} className="flex items-center">
            <div className="mr-2 w-5 h-5 flex items-center justify-center rounded-md bg-purple-100 dark:bg-purple-900">
              <Settings className="h-3.5 w-3.5 text-purple-700 dark:text-purple-300" />
            </div>
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center">
            <div className="mr-2 w-5 h-5 flex items-center justify-center rounded-md bg-amber-100 dark:bg-amber-900">
              <Bell className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />
            </div>
            <span>Notifications</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <DropdownMenuItem onClick={handleLogout} className="flex items-center">
          <div className="mr-2 w-5 h-5 flex items-center justify-center rounded-md bg-red-100 dark:bg-red-900">
            <LogOut className="h-3.5 w-3.5 text-red-700 dark:text-red-300" />
          </div>
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}