import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NotificationSettings {
  appointments: boolean;
  emergencyAlerts: boolean;
  healthReminders: boolean;
  systemUpdates: boolean;
  sound: boolean;
  email: boolean;
  sms: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: 'en' | 'es' | 'fr' | 'de';
  animations: boolean;
  highContrast: boolean;
}

interface PrivacySettings {
  shareDataForResearch: boolean;
  allowAnalytics: boolean;
  showOnlineStatus: boolean;
  allowLocationAccess: boolean;
}

interface AccessibilitySettings {
  screenReader: boolean;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
  largeButtons: boolean;
  voiceCommands: boolean;
}

interface MedicalSettings {
  units: 'metric' | 'imperial';
  timezone: string;
  emergencyContact: string;
  allergies: string[];
  medications: string[];
  medicalConditions: string[];
}

export interface AppSettings {
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  privacy: PrivacySettings;
  accessibility: AccessibilitySettings;
  medical: MedicalSettings;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (section: keyof AppSettings, newSettings: Partial<AppSettings[keyof AppSettings]>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

const defaultSettings: AppSettings = {
  notifications: {
    appointments: true,
    emergencyAlerts: true,
    healthReminders: true,
    systemUpdates: false,
    sound: true,
    email: true,
    sms: false
  },
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    language: 'en',
    animations: true,
    highContrast: false
  },
  privacy: {
    shareDataForResearch: false,
    allowAnalytics: true,
    showOnlineStatus: true,
    allowLocationAccess: true
  },
  accessibility: {
    screenReader: false,
    keyboardNavigation: false,
    reducedMotion: false,
    largeButtons: false,
    voiceCommands: false
  },
  medical: {
    units: 'metric',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emergencyContact: '',
    allergies: [],
    medications: [],
    medicalConditions: []
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('curalink-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('curalink-settings', JSON.stringify(settings));
    
    // Apply theme changes to document
    if (settings.appearance.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.appearance.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Apply font size changes
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    document.documentElement.style.fontSize = fontSizeMap[settings.appearance.fontSize];

    // Apply high contrast
    if (settings.appearance.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (settings.accessibility.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

  }, [settings]);

  const updateSettings = (section: keyof AppSettings, newSettings: Partial<AppSettings[keyof AppSettings]>) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...newSettings
      }
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('curalink-settings');
  };

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (settingsJson: string) => {
    try {
      const imported = JSON.parse(settingsJson);
      setSettings({ ...defaultSettings, ...imported });
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      updateSettings,
      resetSettings,
      exportSettings,
      importSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};