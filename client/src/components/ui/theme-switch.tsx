import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "./button";

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={toggleTheme} 
      className="h-8 w-8 p-0 rounded-full"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-gray-600" />
      ) : (
        <Sun className="h-4 w-4 text-yellow-400" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}