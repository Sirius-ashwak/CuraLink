import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Moon, Sun, Monitor, Bell, Shield, Eye, Download, Upload, Heart, Globe, Accessibility, Volume2 } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function ComprehensiveSettings() {
  const { toast } = useToast();
  const { settings, updateSettings, resetSettings, exportSettings, importSettings } = useSettings();

  const handleSettingChange = (section: keyof typeof settings, key: string, value: any) => {
    updateSettings(section, { [key]: value });
    
    toast({
      title: "Settings Updated",
      description: `${key.charAt(0).toUpperCase() + key.slice(1)} preference saved successfully.`,
    });
  };

  const handleExportSettings = () => {
    const dataStr = exportSettings();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'curalink-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Settings Exported",
      description: "Your settings have been downloaded successfully.",
    });
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (importSettings(content)) {
          toast({
            title: "Settings Imported",
            description: "Your settings have been restored successfully.",
          });
        } else {
          toast({
            title: "Import Failed",
            description: "Failed to import settings. Please check the file format.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetSettings = () => {
    resetSettings();
    toast({
      title: "Settings Reset",
      description: "All settings have been restored to defaults.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-300">Personalize your complete healthcare experience</p>
        </div>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.appearance.theme} onValueChange={(value) => handleSettingChange("appearance", "theme", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center space-x-2">
                        <Sun className="h-4 w-4" />
                        <span>Light</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center space-x-2">
                        <Moon className="h-4 w-4" />
                        <span>Dark</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4" />
                        <span>System</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Select value={settings.appearance.fontSize} onValueChange={(value) => handleSettingChange("appearance", "fontSize", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={settings.appearance.language} onValueChange={(value) => handleSettingChange("appearance", "language", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="animations">Enable Animations</Label>
                <Switch
                  id="animations"
                  checked={settings.appearance.animations}
                  onCheckedChange={(checked) => handleSettingChange("appearance", "animations", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="highContrast">High Contrast Mode</Label>
                <Switch
                  id="highContrast"
                  checked={settings.appearance.highContrast}
                  onCheckedChange={(checked) => handleSettingChange("appearance", "highContrast", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="appointments">Appointment Reminders</Label>
                <Switch
                  id="appointments"
                  checked={settings.notifications.appointments}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "appointments", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="emergencyAlerts">Emergency Alerts</Label>
                <Switch
                  id="emergencyAlerts"
                  checked={settings.notifications.emergencyAlerts}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "emergencyAlerts", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="healthReminders">Health Reminders</Label>
                <Switch
                  id="healthReminders"
                  checked={settings.notifications.healthReminders}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "healthReminders", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sound">Sound Notifications</Label>
                <Switch
                  id="sound"
                  checked={settings.notifications.sound}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "sound", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email Notifications</Label>
                <Switch
                  id="email"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "email", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sms">SMS Notifications</Label>
                <Switch
                  id="sms"
                  checked={settings.notifications.sms}
                  onCheckedChange={(checked) => handleSettingChange("notifications", "sms", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>Medical Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="units">Units</Label>
                <Select value={settings.medical.units} onValueChange={(value) => handleSettingChange("medical", "units", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (kg, cm, °C)</SelectItem>
                    <SelectItem value="imperial">Imperial (lbs, ft, °F)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  placeholder="Emergency contact phone number"
                  value={settings.medical.emergencyContact}
                  onChange={(e) => handleSettingChange("medical", "emergencyContact", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  placeholder="List any allergies (one per line)"
                  value={settings.medical.allergies.join('\n')}
                  onChange={(e) => handleSettingChange("medical", "allergies", e.target.value.split('\n').filter(Boolean))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  placeholder="List current medications (one per line)"
                  value={settings.medical.medications.join('\n')}
                  onChange={(e) => handleSettingChange("medical", "medications", e.target.value.split('\n').filter(Boolean))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Privacy & Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="shareData">Share Data for Research</Label>
                <Switch
                  id="shareData"
                  checked={settings.privacy.shareDataForResearch}
                  onCheckedChange={(checked) => handleSettingChange("privacy", "shareDataForResearch", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="analytics">Allow Analytics</Label>
                <Switch
                  id="analytics"
                  checked={settings.privacy.allowAnalytics}
                  onCheckedChange={(checked) => handleSettingChange("privacy", "allowAnalytics", checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="onlineStatus">Show Online Status</Label>
                <Switch
                  id="onlineStatus"
                  checked={settings.privacy.showOnlineStatus}
                  onCheckedChange={(checked) => handleSettingChange("privacy", "showOnlineStatus", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="locationAccess">Allow Location Access</Label>
                <Switch
                  id="locationAccess"
                  checked={settings.privacy.allowLocationAccess}
                  onCheckedChange={(checked) => handleSettingChange("privacy", "allowLocationAccess", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Accessibility className="h-5 w-5" />
                <span>Accessibility</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="screenReader">Screen Reader Support</Label>
                <Switch
                  id="screenReader"
                  checked={settings.accessibility.screenReader}
                  onCheckedChange={(checked) => handleSettingChange("accessibility", "screenReader", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="keyboardNavigation">Keyboard Navigation</Label>
                <Switch
                  id="keyboardNavigation"
                  checked={settings.accessibility.keyboardNavigation}
                  onCheckedChange={(checked) => handleSettingChange("accessibility", "keyboardNavigation", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="reducedMotion">Reduced Motion</Label>
                <Switch
                  id="reducedMotion"
                  checked={settings.accessibility.reducedMotion}
                  onCheckedChange={(checked) => handleSettingChange("accessibility", "reducedMotion", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="largeButtons">Large Buttons</Label>
                <Switch
                  id="largeButtons"
                  checked={settings.accessibility.largeButtons}
                  onCheckedChange={(checked) => handleSettingChange("accessibility", "largeButtons", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="voiceCommands">Voice Commands</Label>
                <Switch
                  id="voiceCommands"
                  checked={settings.accessibility.voiceCommands}
                  onCheckedChange={(checked) => handleSettingChange("accessibility", "voiceCommands", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Data Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-3">
                <Button onClick={handleExportSettings} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export Settings
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => document.getElementById('import-input')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </Button>
                <input
                  id="import-input"
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  style={{ display: 'none' }}
                />
              </div>
              
              <Separator />
              
              <Button onClick={handleResetSettings} variant="destructive" className="w-full">
                Reset All Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard">
            <Button variant="outline">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}