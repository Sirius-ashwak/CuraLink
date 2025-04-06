import { useEffect } from 'react';

// Default settings structure matching Settings.tsx
const defaultSettings = {
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
};

/**
 * Hook to initialize application settings from localStorage
 * This applies all the saved settings to the document when the app loads
 */
export const useSettingsInit = () => {
  useEffect(() => {
    try {
      // Try to load settings from localStorage
      const savedSettings = localStorage.getItem('healthConnectSettings');
      const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
      
      // Apply font size setting
      if (settings.appearance.fontSize) {
        document.documentElement.style.fontSize = `${settings.appearance.fontSize}px`;
      }
      
      // Apply theme setting
      if (settings.appearance.theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else if (settings.appearance.theme === 'dark') {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      } else if (settings.appearance.theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.remove(prefersDark ? 'light' : 'dark');
        document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
      }
      
      // Apply animation settings
      if (settings.appearance.animation === false) {
        document.documentElement.classList.add('no-animations');
      }
      
      // Apply accessibility settings
      if (settings.accessibility.reducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      }
      
      if (settings.accessibility.highContrast) {
        document.documentElement.classList.add('high-contrast');
      }
      
      console.log('Application settings initialized');
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  }, []);
};

export default useSettingsInit;