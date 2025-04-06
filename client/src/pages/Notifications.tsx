import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { BellRing, ArrowLeft, Check, Clock, Calendar, Pill, Stethoscope, Ambulance, Video, Ban } from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Example notification data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Appointment Reminder',
      message: 'You have an appointment with Dr. Smith tomorrow at 10:00 AM',
      time: '2 hours ago',
      read: false,
      type: 'appointment'
    },
    {
      id: 2,
      title: 'Medicine Reminder',
      message: 'Time to take your daily medication: Atorvastatin 20mg',
      time: '4 hours ago',
      read: true,
      type: 'medicine'
    },
    {
      id: 3,
      title: 'Doctor Match Result',
      message: 'We found 3 specialists matching your symptoms. View your matches now.',
      time: 'Yesterday',
      read: true,
      type: 'doctor'
    },
    {
      id: 4,
      title: 'Video Consultation',
      message: 'Your video consultation with Dr. Johnson is scheduled in 30 minutes',
      time: 'Yesterday',
      read: false,
      type: 'video'
    },
    {
      id: 5,
      title: 'Emergency Transport Update',
      message: 'Your emergency transport request #42351 has been assigned to driver Mark Wilson',
      time: '2 days ago',
      read: true,
      type: 'emergency'
    }
  ]);
  
  // Example notification settings
  const [settings, setSettings] = useState({
    email: {
      appointments: true,
      medicineReminders: true,
      doctorMatches: false,
      emergencyAlerts: true,
      systemUpdates: false
    },
    push: {
      appointments: true,
      medicineReminders: true,
      doctorMatches: true,
      emergencyAlerts: true,
      systemUpdates: true
    },
    sms: {
      appointments: false,
      medicineReminders: false,
      doctorMatches: false,
      emergencyAlerts: true,
      systemUpdates: false
    }
  });
  
  const handleSettingChange = (category: string, setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: value
      }
    }));
    
    toast({
      title: "Notification settings updated",
      description: `${setting} notifications ${value ? 'enabled' : 'disabled'} for ${category}`,
      variant: "default"
    });
  };
  
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    toast({
      title: "All notifications marked as read",
      description: "Your notification inbox is now clear",
      variant: "default"
    });
  };
  
  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed from your inbox",
      variant: "default"
    });
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case 'medicine':
        return <Pill className="h-5 w-5 text-green-500" />;
      case 'doctor':
        return <Stethoscope className="h-5 w-5 text-purple-500" />;
      case 'emergency':
        return <Ambulance className="h-5 w-5 text-red-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-amber-500" />;
      default:
        return <BellRing className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Badge className="bg-blue-600">Appointment</Badge>;
      case 'medicine':
        return <Badge className="bg-green-600">Medicine</Badge>;
      case 'doctor':
        return <Badge className="bg-purple-600">Doctor</Badge>;
      case 'emergency':
        return <Badge className="bg-red-600">Emergency</Badge>;
      case 'video':
        return <Badge className="bg-amber-600">Video</Badge>;
      default:
        return <Badge>System</Badge>;
    }
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Unauthorized Access</CardTitle>
            <CardDescription>
              Please log in to view your notifications.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => setLocation('/login')} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setLocation('/dashboard')}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-600">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <Badge className="ml-4 bg-indigo-600">{unreadCount} unread</Badge>
          )}
        </div>
        
        <Button 
          variant="outline"
          onClick={markAllAsRead}
          className="border-indigo-600/50 text-indigo-400"
          disabled={unreadCount === 0}
        >
          <Check className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="mb-4 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border border-indigo-900/30 shadow-2xl overflow-hidden relative">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 to-blue-200">
                Recent Notifications
              </CardTitle>
              <CardDescription>
                Stay updated with your appointments, medicines, and health alerts
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <BellRing className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No notifications</h3>
                  <p className="text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className={`p-4 rounded-lg border ${notification.read ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-800/50 border-indigo-900/50'}`}>
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 p-2 rounded-full ${notification.read ? 'bg-gray-800' : 'bg-indigo-900/50'}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-medium ${notification.read ? 'text-gray-300' : 'text-indigo-100'}`}>
                              {notification.title}
                            </h3>
                            
                            {getNotificationBadge(notification.type)}
                          </div>
                          
                          <p className="text-gray-400 text-sm mb-2">{notification.message}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="mr-1 h-3 w-3" />
                              {notification.time}
                            </div>
                            
                            <div className="flex gap-2">
                              {!notification.read && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 text-xs text-indigo-400"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark as read
                                </Button>
                              )}
                              
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 text-xs text-gray-400 hover:text-rose-400"
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border border-indigo-900/30 shadow-2xl overflow-hidden relative">
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
            
            <CardHeader className="relative z-10">
              <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 to-blue-200">
                Notification Settings
              </CardTitle>
              <CardDescription>
                Customize how you receive alerts
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Email Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-appointments" className="text-sm">Appointments</label>
                      <Switch 
                        id="email-appointments" 
                        checked={settings.email.appointments}
                        onCheckedChange={(checked) => handleSettingChange('email', 'appointments', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-medicine" className="text-sm">Medicine Reminders</label>
                      <Switch 
                        id="email-medicine" 
                        checked={settings.email.medicineReminders}
                        onCheckedChange={(checked) => handleSettingChange('email', 'medicineReminders', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-doctors" className="text-sm">Doctor Matches</label>
                      <Switch 
                        id="email-doctors" 
                        checked={settings.email.doctorMatches}
                        onCheckedChange={(checked) => handleSettingChange('email', 'doctorMatches', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-emergency" className="text-sm">Emergency Alerts</label>
                      <Switch 
                        id="email-emergency" 
                        checked={settings.email.emergencyAlerts}
                        onCheckedChange={(checked) => handleSettingChange('email', 'emergencyAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="email-system" className="text-sm">System Updates</label>
                      <Switch 
                        id="email-system" 
                        checked={settings.email.systemUpdates}
                        onCheckedChange={(checked) => handleSettingChange('email', 'systemUpdates', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-800" />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Push Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="push-appointments" className="text-sm">Appointments</label>
                      <Switch 
                        id="push-appointments" 
                        checked={settings.push.appointments}
                        onCheckedChange={(checked) => handleSettingChange('push', 'appointments', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="push-medicine" className="text-sm">Medicine Reminders</label>
                      <Switch 
                        id="push-medicine" 
                        checked={settings.push.medicineReminders}
                        onCheckedChange={(checked) => handleSettingChange('push', 'medicineReminders', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="push-doctors" className="text-sm">Doctor Matches</label>
                      <Switch 
                        id="push-doctors" 
                        checked={settings.push.doctorMatches}
                        onCheckedChange={(checked) => handleSettingChange('push', 'doctorMatches', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="push-emergency" className="text-sm">Emergency Alerts</label>
                      <Switch 
                        id="push-emergency" 
                        checked={settings.push.emergencyAlerts}
                        onCheckedChange={(checked) => handleSettingChange('push', 'emergencyAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="push-system" className="text-sm">System Updates</label>
                      <Switch 
                        id="push-system" 
                        checked={settings.push.systemUpdates}
                        onCheckedChange={(checked) => handleSettingChange('push', 'systemUpdates', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-800" />
                
                <div>
                  <h3 className="text-lg font-medium mb-3">SMS Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="sms-appointments" className="text-sm">Appointments</label>
                      <Switch 
                        id="sms-appointments" 
                        checked={settings.sms.appointments}
                        onCheckedChange={(checked) => handleSettingChange('sms', 'appointments', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="sms-medicine" className="text-sm">Medicine Reminders</label>
                      <Switch 
                        id="sms-medicine" 
                        checked={settings.sms.medicineReminders}
                        onCheckedChange={(checked) => handleSettingChange('sms', 'medicineReminders', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="sms-doctors" className="text-sm">Doctor Matches</label>
                      <Switch 
                        id="sms-doctors" 
                        checked={settings.sms.doctorMatches}
                        onCheckedChange={(checked) => handleSettingChange('sms', 'doctorMatches', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="sms-emergency" className="text-sm">Emergency Alerts</label>
                      <Switch 
                        id="sms-emergency" 
                        checked={settings.sms.emergencyAlerts}
                        onCheckedChange={(checked) => handleSettingChange('sms', 'emergencyAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <label htmlFor="sms-system" className="text-sm">System Updates</label>
                      <Switch 
                        id="sms-system" 
                        checked={settings.sms.systemUpdates}
                        onCheckedChange={(checked) => handleSettingChange('sms', 'systemUpdates', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t border-gray-800 mt-6 pt-6 relative z-10">
              <Button className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}