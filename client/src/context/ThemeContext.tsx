import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Load theme from localStorage if available, default to dark
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'dark';
  });

  // Initialize theme on mount
  useEffect(() => {
    // Check if we need to apply the theme on first render
    const root = window.document.documentElement;
    const initialTheme = localStorage.getItem('theme') as Theme || 'dark';
    
    if (initialTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, []);

  // Apply theme class to document when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    
    // Add a transition class first for smooth theme switching
    root.classList.add('theme-transition');

    // Set a small timeout to ensure the transition class is applied
    setTimeout(() => {
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        body.classList.add('dark');
        body.classList.remove('light');
        
        // Reset any light theme overrides
        root.style.removeProperty('--background');
        root.style.removeProperty('--foreground');
        root.style.removeProperty('--card');
        root.style.removeProperty('--card-foreground');
        root.style.removeProperty('--popover');
        root.style.removeProperty('--popover-foreground');
        root.style.removeProperty('--primary');
        root.style.removeProperty('--primary-foreground');
        root.style.removeProperty('--secondary');
        root.style.removeProperty('--secondary-foreground');
        root.style.removeProperty('--muted');
        root.style.removeProperty('--muted-foreground');
        root.style.removeProperty('--accent');
        root.style.removeProperty('--accent-foreground');
        root.style.removeProperty('--destructive');
        root.style.removeProperty('--destructive-foreground');
        root.style.removeProperty('--border');
        root.style.removeProperty('--input');
        root.style.removeProperty('--ring');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        body.classList.add('light');
        body.classList.remove('dark');
        
        // Set light theme CSS variables directly
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

      // Remove the transition class after the switch is complete
      setTimeout(() => {
        root.classList.remove('theme-transition');
      }, 500);
    }, 10);

    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);