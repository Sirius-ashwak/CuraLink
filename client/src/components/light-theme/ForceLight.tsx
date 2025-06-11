import React, { useEffect } from 'react';

/**
 * ForceLight Component
 * A utility component that directly applies light theme styles to the document
 * This is a more direct approach than relying only on CSS classes
 */
export const ForceLight: React.FC = () => {
  useEffect(() => {
    // Force light theme by directly manipulating the DOM
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    document.body.classList.remove('dark');
    document.body.classList.add('light');
    
    // Set light theme variable on the document element
    document.documentElement.style.setProperty('--background', '210 40% 98%');
    document.documentElement.style.setProperty('--foreground', '222 47% 11%');
    document.documentElement.style.setProperty('--card', '0 0% 100%');
    document.documentElement.style.setProperty('--card-foreground', '222 47% 11%');
    document.documentElement.style.setProperty('--popover', '0 0% 100%');
    document.documentElement.style.setProperty('--popover-foreground', '222 47% 11%');
    document.documentElement.style.setProperty('--primary', '210 100% 50%');
    document.documentElement.style.setProperty('--primary-foreground', '0 0% 100%');
    document.documentElement.style.setProperty('--secondary', '210 40% 96.1%');
    document.documentElement.style.setProperty('--secondary-foreground', '222 47% 11%');
    document.documentElement.style.setProperty('--muted', '210 40% 96.1%');
    document.documentElement.style.setProperty('--muted-foreground', '215 16% 47%');
    document.documentElement.style.setProperty('--accent', '210 40% 96.1%');
    document.documentElement.style.setProperty('--accent-foreground', '222 47% 11%');
    document.documentElement.style.setProperty('--destructive', '0 84.2% 60.2%');
    document.documentElement.style.setProperty('--destructive-foreground', '210 40% 98%');
    document.documentElement.style.setProperty('--border', '214.3 31.8% 91.4%');
    document.documentElement.style.setProperty('--input', '214.3 31.8% 91.4%');
    document.documentElement.style.setProperty('--ring', '221.2 83.2% 53.3%');
    
    // Set background color directly
    document.body.style.backgroundColor = 'hsl(210, 40%, 98%)';
    document.body.style.color = 'hsl(222, 47%, 11%)';
    
    // Set a data attribute on the document element for CSS targeting
    document.documentElement.setAttribute('data-forced-theme', 'light');
    
    // Clean up function
    return () => {
      document.documentElement.removeAttribute('data-forced-theme');
    };
  }, []);
  
  return null;
};

export default ForceLight;