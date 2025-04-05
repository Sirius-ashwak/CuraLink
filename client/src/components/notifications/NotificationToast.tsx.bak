import { useState, useEffect } from "react";
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from "lucide-react";

interface NotificationToastProps {
  title: string;
  message: string;
  type?: "default" | "destructive" | "success" | "info" | "warning" | "error";
  duration?: number;
  onClose?: () => void;
}

export default function NotificationToast({
  title, 
  message, 
  type = "default", 
  duration = 5000,
  onClose 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  const getBackgroundColor = () => {
    switch (type) {
      case "success": return "border-green-500";
      case "info": 
      case "default": return "border-blue-500";
      case "warning": return "border-yellow-500";
      case "error":
      case "destructive": return "border-red-500";
      default: return "border-blue-500";
    }
  };
  
  const getIconColor = () => {
    switch (type) {
      case "success": return "text-green-500";
      case "info":
      case "default": return "text-blue-500";
      case "warning": return "text-yellow-500";
      case "error":
      case "destructive": return "text-red-500";
      default: return "text-blue-500";
    }
  };
  
  const renderIcon = () => {
    switch (type) {
      case "success": 
        return <CheckCircle className="h-5 w-5 mr-2" />;
      case "info":
      case "default": 
        return <Info className="h-5 w-5 mr-2" />;
      case "warning": 
        return <AlertTriangle className="h-5 w-5 mr-2" />;
      case "error":
      case "destructive": 
        return <AlertCircle className="h-5 w-5 mr-2" />;
      default: 
        return <Info className="h-5 w-5 mr-2" />;
    }
  };
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className={`fixed bottom-16 right-4 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 flex items-start z-50 md:bottom-4 border-l-4 ${getBackgroundColor()}`}
    >
      <div className={getIconColor()}>
        {renderIcon()}
      </div>
      <div className="flex-grow">
        <h4 className="font-medium dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>
      <button 
        className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" 
        onClick={() => {
          setIsVisible(false);
          if (onClose) onClose();
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
