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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Sun, Moon, Laptop, Globe, Volume2, ArrowLeft, SaveIcon, Languages, Shield, Eye, Clock, Fingerprint, Siren, Headphones } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Example settings data
  const [settings, setSettings] = useState({
    appearance: {
      theme: 'dark',
      fontSize: 16,
      animation: true,
      language: 'english'
    },
    privacy: {
      shareHealthData: false,
      shareLocation: false,
      anonymizeData: true,
      twoFactorAuth: false,
      biometricLogin: true
    },
    notifications: {
      sound: true,
      volume: 70,
      enableNotifications: true,
      doNotDisturb: false,
      emergencyAlerts: true
    },
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      screenReader: false,
      captioning: false,
      textToSpeech: false
    }
  });
  
  const handleAppearanceChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        [key]: value
      }
    }));
  };
  
  const handlePrivacyChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };
  
  const handleNotificationChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };
  
  const handleAccessibilityChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: value
      }
    }));
  };
  
  const saveSettings = () => {
    // In a real app, you would make an API call to save the settings
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully.",
      variant: "default"
    });
  };
  
  const getThemeIcon = () => {
    switch (settings.appearance.theme) {
      case 'light':
        return <Sun className="h-5 w-5 text-amber-500" />;
      case 'dark':
        return <Moon className="h-5 w-5 text-indigo-400" />;
      case 'system':
        return <Laptop className="h-5 w-5 text-gray-400" />;
      default:
        return <Moon className="h-5 w-5 text-indigo-400" />;
    }
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Unauthorized Access</CardTitle>
            <CardDescription>
              Please log in to view your settings.
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
  
  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="flex items-center mb-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation('/dashboard')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-600">
          Settings
        </h1>
      </div>
      
      <Card className="mb-8 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 border border-indigo-900/30 shadow-2xl overflow-hidden relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 rounded-full filter blur-3xl opacity-30 pointer-events-none"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-100 to-blue-200">
            Application Settings
          </CardTitle>
          <CardDescription>
            Customize your experience with HealthConnect
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid grid-cols-4 mb-8">
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Eye className="h-4 w-4" /> Appearance
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> Privacy
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" /> Notifications
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="flex items-center gap-2">
                <Headphones className="h-4 w-4" /> Accessibility
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="theme" className="text-base">Theme</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-grow">
                      <Select 
                        value={settings.appearance.theme} 
                        onValueChange={(value) => handleAppearanceChange('theme', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                      {getThemeIcon()}
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-800" />
                
                <div className="space-y-3">
                  <Label htmlFor="fontSize" className="text-base">Font Size</Label>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Small</span>
                      <span className="text-sm text-gray-500">Large</span>
                    </div>
                    <Slider 
                      id="fontSize"
                      min={12}
                      max={20}
                      step={1}
                      value={[settings.appearance.fontSize]}
                      onValueChange={([value]) => handleAppearanceChange('fontSize', value)}
                      className="py-2"
                    />
                    <div className="text-center text-sm text-gray-400">
                      Current: {settings.appearance.fontSize}px
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-800" />
                
                <div className="space-y-3">
                  <Label htmlFor="animation" className="text-base">Interface Animation</Label>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm">Enable animations</p>
                      <p className="text-xs text-gray-500">Toggle UI animations and transitions</p>
                    </div>
                    <Switch 
                      id="animation"
                      checked={settings.appearance.animation}
                      onCheckedChange={(checked) => handleAppearanceChange('animation', checked)}
                    />
                  </div>
                </div>
                
                <Separator className="bg-gray-800" />
                
                <div className="space-y-3">
                  <Label htmlFor="language" className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Language
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-grow">
                      <Select 
                        value={settings.appearance.language} 
                        onValueChange={(value) => handleAppearanceChange('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="german">German</SelectItem>
                          <SelectItem value="mandarin">Mandarin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                      <Languages className="h-5 w-5 text-indigo-400" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="privacy">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Health Data Privacy</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Share health data with providers</p>
                        <p className="text-xs text-gray-500">Allow healthcare providers to access your health information</p>
                      </div>
                      <Switch 
                        checked={settings.privacy.shareHealthData}
                        onCheckedChange={(checked) => handlePrivacyChange('shareHealthData', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Share location for emergency services</p>
                        <p className="text-xs text-gray-500">Enable location sharing for emergency transport</p>
                      </div>
                      <Switch 
                        checked={settings.privacy.shareLocation}
                        onCheckedChange={(checked) => handlePrivacyChange('shareLocation', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Anonymize data for research</p>
                        <p className="text-xs text-gray-500">Contribute anonymized data to improve healthcare research</p>
                      </div>
                      <Switch 
                        checked={settings.privacy.anonymizeData}
                        onCheckedChange={(checked) => handlePrivacyChange('anonymizeData', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-800" />
                
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Security</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Two-factor authentication</p>
                        <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Switch 
                        checked={settings.privacy.twoFactorAuth}
                        onCheckedChange={(checked) => handlePrivacyChange('twoFactorAuth', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Biometric login</p>
                        <p className="text-xs text-gray-500">Use fingerprint or face recognition to log in</p>
                      </div>
                      <Switch 
                        checked={settings.privacy.biometricLogin}
                        onCheckedChange={(checked) => handlePrivacyChange('biometricLogin', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="text-sm border-red-900/50 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    Delete All Health Data
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Sound Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Notification sounds</p>
                        <p className="text-xs text-gray-500">Play sounds for notifications</p>
                      </div>
                      <Switch 
                        checked={settings.notifications.sound}
                        onCheckedChange={(checked) => handleNotificationChange('sound', checked)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="volume" className="text-sm">Notification Volume</Label>
                      <div className="flex items-center gap-4">
                        <Volume2 className="h-4 w-4 text-gray-500" />
                        <Slider 
                          id="volume"
                          disabled={!settings.notifications.sound}
                          min={0}
                          max={100}
                          step={1}
                          value={[settings.notifications.volume]}
                          onValueChange={([value]) => handleNotificationChange('volume', value)}
                          className="py-2 flex-1"
                        />
                        <span className="text-sm w-8 text-right">{settings.notifications.volume}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-800" />
                
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Alert Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Enable notifications</p>
                        <p className="text-xs text-gray-500">Receive all app notifications</p>
                      </div>
                      <Switch 
                        checked={settings.notifications.enableNotifications}
                        onCheckedChange={(checked) => handleNotificationChange('enableNotifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm">Do Not Disturb</p>
                          <p className="text-xs text-gray-500">Mute non-emergency notifications</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.notifications.doNotDisturb}
                        onCheckedChange={(checked) => handleNotificationChange('doNotDisturb', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 flex items-center gap-2">
                        <Siren className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-sm">Emergency alerts</p>
                          <p className="text-xs text-gray-500">Always receive critical emergency notifications</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.notifications.emergencyAlerts}
                        onCheckedChange={(checked) => handleNotificationChange('emergencyAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="accessibility">
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Visual Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Reduced motion</p>
                        <p className="text-xs text-gray-500">Minimize animations for motion sensitivity</p>
                      </div>
                      <Switch 
                        checked={settings.accessibility.reducedMotion}
                        onCheckedChange={(checked) => handleAccessibilityChange('reducedMotion', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">High contrast</p>
                        <p className="text-xs text-gray-500">Enhance visual differences for better readability</p>
                      </div>
                      <Switch 
                        checked={settings.accessibility.highContrast}
                        onCheckedChange={(checked) => handleAccessibilityChange('highContrast', checked)}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-gray-800" />
                
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Assistance Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Screen reader support</p>
                        <p className="text-xs text-gray-500">Optimize for screen readers</p>
                      </div>
                      <Switch 
                        checked={settings.accessibility.screenReader}
                        onCheckedChange={(checked) => handleAccessibilityChange('screenReader', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Closed captioning</p>
                        <p className="text-xs text-gray-500">Enable captioning for video content</p>
                      </div>
                      <Switch 
                        checked={settings.accessibility.captioning}
                        onCheckedChange={(checked) => handleAccessibilityChange('captioning', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">Text to speech</p>
                        <p className="text-xs text-gray-500">Read text content aloud</p>
                      </div>
                      <Switch 
                        checked={settings.accessibility.textToSpeech}
                        onCheckedChange={(checked) => handleAccessibilityChange('textToSpeech', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="border-t border-gray-800 mt-6 pt-6 relative z-10">
          <Button 
            onClick={saveSettings} 
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </CardFooter>
      </Card>
      
      <div className="bg-gradient-to-r from-indigo-900/20 to-blue-900/20 border border-indigo-900/30 rounded-lg p-4 text-sm text-gray-400">
        <p className="flex items-center">
          <Fingerprint className="h-4 w-4 mr-2 text-indigo-400" />
          Last settings update: <span className="ml-1 text-gray-300">Today at {new Date().toLocaleTimeString()}</span>
        </p>
      </div>
    </div>
  );
}