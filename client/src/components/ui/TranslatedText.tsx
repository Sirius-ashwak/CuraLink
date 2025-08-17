import React from 'react';
import { useTranslation } from '@/context/TranslationContext';

interface TranslatedTextProps {
  id: string;
  values?: Record<string, string | number>;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Component that translates text based on the current language
 * Falls back to children if translation is not found
 */
export const TranslatedText: React.FC<TranslatedTextProps> = ({ 
  id, 
  values = {}, 
  children,
  className
}) => {
  const { translate } = useTranslation();
  
  // Get the translated text
  let translatedText = translate(id);
  
  // Replace placeholders with values
  if (values && Object.keys(values).length > 0) {
    Object.entries(values).forEach(([key, value]) => {
      translatedText = translatedText.replace(`{{${key}}}`, String(value));
    });
  }
  
  // If no translation is found and children are provided, use children as fallback
  if (translatedText === id && children) {
    return <>{children}</>;
  }
  
  return <span className={className}>{translatedText}</span>;
};

/**
 * Higher-order component that translates all text props
 */
export function withTranslation<P extends object>(
  Component: React.ComponentType<P>,
  textProps: string[]
): React.FC<P> {
  return (props: P) => {
    const { translate } = useTranslation();
    
    const translatedProps = { ...props };
    
    textProps.forEach(prop => {
      if (prop in props) {
        translatedProps[prop as keyof P] = translate(props[prop as keyof P] as string) as any;
      }
    });
    
    return <Component {...translatedProps} />;
  };
}

export default TranslatedText;