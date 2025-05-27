import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "./button";
import { motion } from "framer-motion";

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button 
      variant="outline" 
      size="icon"
      onClick={toggleTheme} 
      className={`
        rounded-full overflow-hidden relative
        ${theme === 'light' 
          ? 'bg-blue-50 border-blue-200 shadow-sm' 
          : 'bg-gray-900 border-gray-700 shadow-md'
        }
        transition-all duration-300 ease-in-out hover:scale-105
      `}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="absolute inset-0 w-full h-full">
        {theme === 'light' ? (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white opacity-60"></div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 opacity-60"></div>
        )}
      </div>
      
      <motion.div 
        initial={{ rotate: 0 }}
        animate={{ rotate: theme === 'light' ? 0 : 180 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 120 }}
        className="relative z-10"
      >
        {theme === 'light' ? (
          <Moon className="h-[1.2rem] w-[1.2rem] text-blue-600" />
        ) : (
          <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-400" />
        )}
      </motion.div>
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}