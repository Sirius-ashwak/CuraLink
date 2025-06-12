import React, { useEffect, ReactNode } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface LightThemeProviderProps {
  children: ReactNode;
  forceLight?: boolean; // When true, forces light theme regardless of context
}

/**
 * LightThemeProvider
 * A component that ensures light theme is properly applied throughout the application
 * It can either respect the user's theme preference or force light theme mode
 */
export const LightThemeProvider: React.FC<LightThemeProviderProps> = ({
  children,
  forceLight = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  
  // Force light theme if needed or ensure proper light theme application
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Either follow the forceLight prop or respect the theme context
    if (forceLight && theme === 'dark') {
      // Switch to light theme if we're forcing it
      toggleTheme();
    }
    
    // Add additional light theme classes for extra style control
    if (forceLight || theme === 'light') {
      root.classList.add('light-theme-active');
      root.classList.add('light');
      root.classList.remove('dark');
      
      // Additional attributes to help with CSS specificity
      root.setAttribute('data-theme', 'light');
      
      // Apply to body as well for extra selectors
      body.classList.add('light');
      body.classList.remove('dark');
    }
    
    return () => {
      if (forceLight) {
        // Only remove our custom classes, not the theme itself
        root.classList.remove('light-theme-active');
        root.removeAttribute('data-theme');
      }
    };
  }, [theme, toggleTheme, forceLight]);
  
  return <>{children}</>;
};