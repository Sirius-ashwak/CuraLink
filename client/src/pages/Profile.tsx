import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Shield, Phone, Heart, FileText, CalendarDays, BadgeCheck } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("personal");
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.profile?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '(555) 123-4567'
    },
    healthInfo: {
      bloodType: 'O+',
      allergies: 'Penicillin, Peanuts',
      conditions: 'Asthma, Hypertension'
    }
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmitPersonal = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would make an API call here to update the user's profile
    if (user) {
      setUser({
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        profile: {
          ...user.profile,
          phone: formData.phone
        }
      });
      
      toast({
        title: "Profile updated",
        description: "Your personal information has been updated successfully.",
        variant: "default"
      });
    }
  };
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Your new password and confirmation password do not match.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, you would make an API call to verify the current password 
    // and update to the new password
    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
      variant: "default"
    });
    
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };
  
  const handleEmergencyContactUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would make an API call to update emergency contact info
    toast({
      title: "Emergency contact updated",
      description: "Your emergency contact information has been updated successfully.",
      variant: "default"
    });
  };
  
  const handleHealthInfoUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would make an API call to update health information
    toast({
      title: "Health information updated",
      description: "Your health information has been updated successfully.",
      variant: "default"
    });
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Unauthorized Access</CardTitle>
            <CardDescription>
              Please log in to view your profile.
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
  
  const firstLetters = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  
  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <div className="relative">
          <Avatar className="h-20 w-20 bg-gradient-to-r from-indigo-500 to-blue-600 shadow-lg">
            <AvatarFallback className="text-2xl text-white">{firstLetters}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
            <BadgeCheck className="h-5 w-5 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-600">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-gray-400">{user.email}</p>
        </div>
      </div>
      
      <Card className="mb-4 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border border-indigo-900/30 shadow-2xl overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 to-blue-200">
            My Profile
          </CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" /> Personal
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" /> Security
              </TabsTrigger>
              <TabsTrigger value="emergency" className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> Emergency
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Heart className="h-4 w-4" /> Health
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal">
              <form onSubmit={handleSubmitPersonal}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                  Save Changes
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="security">
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input 
                      id="currentPassword" 
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                  Update Password
                </Button>
              </form>
              
              <div className="mt-10 pt-6 border-t border-gray-800">
                <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Enhance your account security</p>
                    <p className="text-xs text-gray-500">
                      Add an extra layer of security by enabling 2FA
                    </p>
                  </div>
                  <Button variant="outline" className="border-indigo-600 text-indigo-400">
                    <Shield className="mr-2 h-4 w-4" /> Enable 2FA
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="emergency">
              <form onSubmit={handleEmergencyContactUpdate}>
                <div className="space-y-6 max-w-md">
                  <h3 className="text-lg font-medium">Emergency Contact Information</h3>
                  
                  <div className="space-y-3">
                    <Label htmlFor="emergencyName">Contact Name</Label>
                    <Input 
                      id="emergencyName" 
                      value={formData.emergencyContact.name}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          name: e.target.value
                        }
                      })}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="emergencyRelationship">Relationship</Label>
                    <Input 
                      id="emergencyRelationship" 
                      value={formData.emergencyContact.relationship}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          relationship: e.target.value
                        }
                      })}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="emergencyPhone">Phone Number</Label>
                    <Input 
                      id="emergencyPhone" 
                      value={formData.emergencyContact.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          phone: e.target.value
                        }
                      })}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                </div>
                
                <Button type="submit" className="mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                  Update Emergency Contact
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="health">
              <form onSubmit={handleHealthInfoUpdate}>
                <div className="space-y-6 max-w-md">
                  <h3 className="text-lg font-medium">Personal Health Information</h3>
                  
                  <div className="space-y-3">
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <Input 
                      id="bloodType" 
                      value={formData.healthInfo.bloodType}
                      onChange={(e) => setFormData({
                        ...formData,
                        healthInfo: {
                          ...formData.healthInfo,
                          bloodType: e.target.value
                        }
                      })}
                      className="bg-gray-800/50 border-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Input 
                      id="allergies" 
                      value={formData.healthInfo.allergies}
                      onChange={(e) => setFormData({
                        ...formData,
                        healthInfo: {
                          ...formData.healthInfo,
                          allergies: e.target.value
                        }
                      })}
                      className="bg-gray-800/50 border-gray-700"
                    />
                    <p className="text-xs text-gray-500">
                      List any allergies separated by commas
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="conditions">Medical Conditions</Label>
                    <Input 
                      id="conditions" 
                      value={formData.healthInfo.conditions}
                      onChange={(e) => setFormData({
                        ...formData,
                        healthInfo: {
                          ...formData.healthInfo,
                          conditions: e.target.value
                        }
                      })}
                      className="bg-gray-800/50 border-gray-700"
                    />
                    <p className="text-xs text-gray-500">
                      List any pre-existing medical conditions separated by commas
                    </p>
                  </div>
                </div>
                
                <Button type="submit" className="mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                  Update Health Information
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t border-gray-800 mt-6 pt-6 relative z-10 flex justify-between">
          <Button variant="outline" className="border-gray-700 text-gray-400" onClick={() => setLocation('/dashboard')}>
            Return to Dashboard
          </Button>
          
          <div className="flex items-center text-sm text-gray-500">
            <FileText className="h-4 w-4 mr-2" />
            Last updated: <span className="ml-1 text-gray-400">Today at {new Date().toLocaleTimeString()}</span>
          </div>
        </CardFooter>
      </Card>
      
      <div className="bg-gradient-to-r from-indigo-900/20 to-blue-900/20 border border-indigo-900/30 rounded-lg p-4 text-sm text-gray-400">
        <p className="flex items-center">
          <CalendarDays className="h-4 w-4 mr-2 text-indigo-400" />
          Account created: <span className="ml-1 text-gray-300">April 1, 2025</span>
        </p>
      </div>
    </div>
  );
}