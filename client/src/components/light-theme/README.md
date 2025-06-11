# Light Theme Components

This directory contains custom components designed specifically for the light theme in our telehealth platform.

## How to Use

These components can be used explicitly when you want to force light theme styling for specific elements, 
while still allowing the global theme system to function normally.

```tsx
import { LightThemeButton } from '@/components/light-theme/LightThemeButton';

// In your component
<LightThemeButton>Light Theme Button</LightThemeButton>
```

## Available Components

- `LightThemeButton`: Button component with light theme styling
- `LightThemeCard`: Card component with light theme styling
- `LightThemeInput`: Input field with light theme styling
- `LightThemeSelect`: Select dropdown with light theme styling
- `LightThemeSwitch`: Toggle switch with light theme styling
- `LightThemeBadge`: Badge component with light theme styling
- `LightThemeNavigation`: Navigation components with light theme styling
- `LightThemeModal`: Modal and dialog components with light theme styling
- `LightThemeHealthComponents`: Healthcare-specific components with light theme styling

## Icons

The `LightThemeIcons.tsx` file contains custom icons designed specifically for light theme:

- `HomeLightIcon`
- `HealthRecordLightIcon`
- `DoctorLightIcon`
- `AppointmentLightIcon`
- `EmergencyLightIcon`
- `MessageLightIcon`
- `PrescriptionLightIcon`
- `SettingsLightIcon`
- `AIAssistantLightIcon`
- `UserLightIcon`

## Implementation Example

```tsx
import { LightThemeCard, LightThemeCardContent } from '@/components/light-theme/LightThemeCard';
import { HomeLightIcon } from '@/components/icons/LightThemeIcons';

function MyComponent() {
  return (
    <LightThemeCard>
      <LightThemeCardContent>
        <div className="flex items-center">
          <HomeLightIcon size={24} className="mr-2" />
          <h2>This card always uses light theme styling</h2>
        </div>
        <p>The rest of your app can still switch between light and dark themes.</p>
      </LightThemeCardContent>
    </LightThemeCard>
  );
}
```