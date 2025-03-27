import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface NotificationToastProps {
  title: string;
  message: string;
  type?: "success" | "info" | "warning" | "error";
  duration?: number;
  onClose?: () => void;
}

export default function NotificationToast({
  title, 
  message, 
  type = "success", 
  duration = 5000,
  onClose 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  const getBackgroundColor = () => {
    switch (type) {
      case "success": return "border-secondary";
      case "info": return "border-primary";
      case "warning": return "border-accent";
      case "error": return "border-error";
      default: return "border-secondary";
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case "success": return "check_circle";
      case "info": return "notifications";
      case "warning": return "warning";
      case "error": return "error";
      default: return "notifications";
    }
  };
  
  const getIconColor = () => {
    switch (type) {
      case "success": return "text-secondary";
      case "info": return "text-primary";
      case "warning": return "text-accent";
      case "error": return "text-error";
      default: return "text-secondary";
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
      className={`fixed bottom-16 right-4 w-72 bg-white rounded-lg shadow-lg p-3 flex items-start z-50 md:bottom-4 border-l-4 ${getBackgroundColor()}`}
    >
      <span className={`material-icons mt-0.5 mr-2 ${getIconColor()}`}>{getIcon()}</span>
      <div className="flex-grow">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-text-secondary">{message}</p>
      </div>
      <button 
        className="ml-2" 
        onClick={() => {
          setIsVisible(false);
          if (onClose) onClose();
        }}
      >
        <span className="material-icons text-sm text-text-secondary">close</span>
      </button>
    </div>
  );
}
