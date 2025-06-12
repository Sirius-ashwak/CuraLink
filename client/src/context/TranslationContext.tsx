import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

// Define available languages
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh';

// Define translation context type
interface TranslationContextType {
  language: Language;
  translate: (key: string) => string;
  changeLanguage: (lang: Language) => void;
  isLoading: boolean;
}

// Create the context
const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

// Translation provider props
interface TranslationProviderProps {
  children: ReactNode;
}

// Translation data type
type TranslationData = {
  [key in Language]: {
    [key: string]: string;
  };
};

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const { settings, updateSettings } = useSettings();
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<TranslationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language from settings
  useEffect(() => {
    if (settings.appearance.language) {
      // Convert from settings format to our language type
      const lang = settings.appearance.language as Language;
      setLanguage(lang);
    }
  }, [settings.appearance.language]);

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        // In a real app, we would load translations from a server or separate files
        // For this demo, we'll include them directly
        const translationData: TranslationData = {
          en: await import('../translations/en.json'),
          es: await import('../translations/es.json'),
          fr: await import('../translations/fr.json'),
          de: await import('../translations/de.json'),
          zh: await import('../translations/zh.json')
        };
        
        setTranslations(translationData);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to empty translations
        setTranslations({
          en: {}, es: {}, fr: {}, de: {}, zh: {}
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, []);

  // Change language function
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    // Update the settings context as well
    updateSettings('appearance', { language: lang });
    
    // Update HTML lang attribute for accessibility
    document.documentElement.lang = lang;
  };

  // Translation function
  const translate = (key: string): string => {
    if (!translations || !translations[language]) {
      return key; // Fallback to key if translations not loaded
    }

    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, translate, changeLanguage, isLoading }}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use the translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};