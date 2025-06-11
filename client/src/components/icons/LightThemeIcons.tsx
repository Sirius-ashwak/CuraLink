import React from 'react';

/**
 * Light Theme Icon Set
 * Custom SVG icons specifically designed for light theme
 */

// Interface for icon props
interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

// Home icon for light theme
export const HomeLightIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      className={className}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
      <circle cx="12" cy="7" r="1" fill="#4B8BF5" />
    </svg>
  );
};

// Health Record icon for light theme
export const HealthRecordLightIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      className={className}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5z" />
      <line x1="9" y1="14" x2="15" y2="14" stroke="#4B8BF5" />
      <line x1="12" y1="11" x2="12" y2="17" stroke="#4B8BF5" />
    </svg>
  );
};

// Doctor icon for light theme
export const DoctorLightIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      className={className}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M16 2H8a3 3 0 0 0-3 3v17h14V5a3 3 0 0 0-3-3Z" />
      <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M10 14h4" stroke="#4B8BF5" />
      <path d="M12 12v4" stroke="#4B8BF5" />
      <path d="M5 22v-4h14v4" />
    </svg>
  );
};

// Appointment icon for light theme
export const AppointmentLightIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      className={className}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01" stroke="#4B8BF5" fill="#4B8BF5" />
      <path d="M12 14h.01" stroke="#4B8BF5" fill="#4B8BF5" />
      <path d="M16 14h.01" stroke="#4B8BF5" fill="#4B8BF5" />
      <path d="M8 18h.01" stroke="#4B8BF5" fill="#4B8BF5" />
      <path d="M12 18h.01" stroke="#4B8BF5" fill="#4B8BF5" />
      <path d="M16 18h.01" stroke="#4B8BF5" fill="#4B8BF5" />
    </svg>
  );
};

// Emergency icon for light theme
export const EmergencyLightIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      className={className}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M8 2h8l4 7h-3.5L20 19h-2l-4.5-10H10l-4.5 10h-2l3.5-10H3l4-7Z" />
      <circle cx="12" cy="13" r="2" fill="#FF5252" />
    </svg>
  );
};

// Message icon for light theme
export const MessageLightIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      className={className}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <circle cx="8" cy="10" r="1" fill="#4B8BF5" />
      <circle cx="12" cy="10" r="1" fill="#4B8BF5" />
      <circle cx="16" cy="10" r="1" fill="#4B8BF5" />
    </svg>
  );
};

// Prescription icon for light theme
export const PrescriptionLightIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      className={className}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Z" />
      <path d="M9 7h5" />
      <path d="M9 11h5" />
      <path d="M9 15h2" />
      <path d="M14 15l2 2" />
      <path d="M16 15l-2 2" stroke="#4B8BF5" />
    </svg>
  );
};

// Settings icon for light theme
export const SettingsLightIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      className={className}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
};

// AI Assistant icon for light theme
export const AIAssistantLightIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      className={className}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M8 10V8c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
      <path d="M7 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="#4B8BF5" />
      <path d="M17 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="#4B8BF5" />
      <path d="M12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="#4B8BF5" fill="none" />
    </svg>
  );
};

// User icon for light theme
export const UserLightIcon: React.FC<IconProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      className={className}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M18 20a6 6 0 0 0-12 0" />
      <circle cx="12" cy="10" r="6" />
      <circle cx="12" cy="10" r="3" fill="#4B8BF5" fillOpacity="0.3" />
    </svg>
  );
};