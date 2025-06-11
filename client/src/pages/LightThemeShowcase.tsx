import React from 'react';
import { Link } from 'wouter';
import { useTheme } from '@/context/ThemeContext';
import { ThemeSwitch } from '@/components/ui/theme-switch';

// Import standard Shadcn UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

// Import light theme components
import { LightThemeButton } from '@/components/light-theme/LightThemeButton';
import { LightThemeCard, LightThemeCardContent, LightThemeCardHeader, LightThemeCardTitle } from '@/components/light-theme/LightThemeCard';
import { LightThemeInput } from '@/components/light-theme/LightThemeInput';
import { LightThemeBadge } from '@/components/light-theme/LightThemeBadge';
import { LightThemeSwitch } from '@/components/light-theme/LightThemeSwitch';

// Import light theme icons
import {
  HomeLightIcon,
  HealthRecordLightIcon,
  DoctorLightIcon,
  AppointmentLightIcon
} from '@/components/icons/LightThemeIcons';

const LightThemeShowcase = () => {
  const { theme } = useTheme();
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Light Theme Components Showcase</h1>
        <ThemeSwitch />
      </div>
      
      <p className="mb-6 text-lg">
        Current theme: <span className="font-medium">{theme}</span>.
        This showcase demonstrates how light theme components can be used alongside regular theme-aware components.
      </p>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Regular Card with Theme-Aware Components */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Standard Theme-Aware Components</h2>
          <p className="mb-4 text-sm">These components change based on the current theme.</p>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Regular Card</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button>Regular Button</Button>
                <div>
                  <Input placeholder="Regular input" className="mb-2" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="theme-aware-switch" />
                  <label htmlFor="theme-aware-switch">Theme-aware switch</label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Light Theme Components */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Light Theme Components</h2>
          <p className="mb-4 text-sm">These components always use light theme styling.</p>
          
          <LightThemeCard className="mb-6">
            <LightThemeCardHeader>
              <LightThemeCardTitle>Light Theme Card</LightThemeCardTitle>
            </LightThemeCardHeader>
            <LightThemeCardContent>
              <div className="space-y-4">
                <LightThemeButton>Light Theme Button</LightThemeButton>
                <div>
                  <LightThemeInput label="Light theme input" placeholder="Enter text" />
                </div>
                <div className="flex items-center gap-2">
                  <LightThemeBadge>Default</LightThemeBadge>
                  <LightThemeBadge variant="primary">Primary</LightThemeBadge>
                  <LightThemeBadge variant="danger">Danger</LightThemeBadge>
                </div>
                <div className="flex items-center gap-2">
                  <LightThemeSwitch label="Light theme switch" checked={true} />
                </div>
              </div>
            </LightThemeCardContent>
          </LightThemeCard>
        </div>
      </div>
      
      {/* Light Theme Icons Section */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Light Theme Icons</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm">
            <HomeLightIcon size={40} className="mb-2" />
            <span className="text-sm">HomeLightIcon</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm">
            <HealthRecordLightIcon size={40} className="mb-2" />
            <span className="text-sm">HealthRecordLightIcon</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm">
            <DoctorLightIcon size={40} className="mb-2" />
            <span className="text-sm">DoctorLightIcon</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm">
            <AppointmentLightIcon size={40} className="mb-2" />
            <span className="text-sm">AppointmentLightIcon</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <Link href="/dashboard">
          <a className="text-blue-600 hover:underline">Back to Dashboard</a>
        </Link>
      </div>
    </div>
  );
};

export default LightThemeShowcase;