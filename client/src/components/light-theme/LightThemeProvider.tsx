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
      document.body.classList.add('light');
      document.body.classList.remove('dark');
      
      // Set CSS variables directly
      root.style.setProperty('--background', '210 40% 98%');
      root.style.setProperty('--foreground', '222 47% 11%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--card-foreground', '222 47% 11%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--popover-foreground', '222 47% 11%');
      root.style.setProperty('--primary', '210 100% 50%');
      root.style.setProperty('--primary-foreground', '0 0% 100%');
      root.style.setProperty('--secondary', '210 40% 96.1%');
      root.style.setProperty('--secondary-foreground', '222 47% 11%');
      root.style.setProperty('--muted', '210 40% 96.1%');
      root.style.setProperty('--muted-foreground', '215 16% 47%');
      root.style.setProperty('--accent', '210 40% 96.1%');
      root.style.setProperty('--accent-foreground', '222 47% 11%');
      root.style.setProperty('--destructive', '0 84.2% 60.2%');
      root.style.setProperty('--destructive-foreground', '210 40% 98%');
      root.style.setProperty('--border', '214.3 31.8% 91.4%');
      root.style.setProperty('--input', '214.3 31.8% 91.4%');
      root.style.setProperty('--ring', '221.2 83.2% 53.3%');
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