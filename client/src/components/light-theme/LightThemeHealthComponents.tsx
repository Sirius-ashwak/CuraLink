import React from 'react';
import { cn } from '@/lib/utils';
import { LightThemeCard, LightThemeCardContent } from './LightThemeCard';
import { LightThemeBadge } from './LightThemeBadge';

// VitalSignMonitor component for displaying patient vital signs
interface VitalSignProps {
  title: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
  icon?: React.ReactNode;
  className?: string;
}

export const LightThemeVitalSign: React.FC<VitalSignProps> = ({
  title,
  value,
  unit,
  status = 'normal',
  icon,
  className,
}) => {
  const statusColors = {
    normal: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  return (
    <div className={cn('flex items-center p-4 bg-white rounded-lg border', className)}>
      {icon && (
        <div className="mr-4 text-blue-500">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="flex items-baseline">
          <p className={cn('text-2xl font-semibold', statusColors[status])}>
            {value}
          </p>
          {unit && <p className="ml-1 text-sm text-gray-500">{unit}</p>}
        </div>
      </div>
    </div>
  );
};

// AppointmentCard component for displaying appointment information
interface AppointmentCardProps {
  doctorName: string;
  doctorSpecialty?: string;
  doctorAvatar?: React.ReactNode;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  notes?: string;
  onJoin?: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
  className?: string;
}

export const LightThemeAppointmentCard: React.FC<AppointmentCardProps> = ({
  doctorName,
  doctorSpecialty,
  doctorAvatar,
  date,
  time,
  status,
  notes,
  onJoin,
  onCancel,
  onReschedule,
  className,
}) => {
  const statusVariants = {
    'scheduled': { badge: 'primary', text: 'Scheduled' },
    'completed': { badge: 'success', text: 'Completed' },
    'cancelled': { badge: 'danger', text: 'Cancelled' },
    'in-progress': { badge: 'warning', text: 'In Progress' },
  };

  const currentStatus = statusVariants[status];

  return (
    <LightThemeCard className={cn('overflow-hidden', className)}>
      <LightThemeCardContent className="p-0">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Appointment</h3>
            <LightThemeBadge 
              variant={currentStatus.badge as any} 
              size="sm"
            >
              {currentStatus.text}
            </LightThemeBadge>
          </div>
          
          <div className="flex items-center mt-4">
            {doctorAvatar && (
              <div className="mr-3">
                {doctorAvatar}
              </div>
            )}
            
            <div>
              <p className="font-medium text-gray-900">{doctorName}</p>
              {doctorSpecialty && (
                <p className="text-sm text-gray-500">{doctorSpecialty}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-gray-50">
          <div className="flex justify-between mb-2">
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-500 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <span className="text-sm text-gray-700">{date}</span>
            </div>
            
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 text-gray-500 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <span className="text-sm text-gray-700">{time}</span>
            </div>
          </div>
          
          {notes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">{notes}</p>
            </div>
          )}
        </div>
        
        {status === 'scheduled' && (
          <div className="flex border-t border-gray-200">
            {onJoin && (
              <button 
                className="flex-1 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
                onClick={onJoin}
              >
                Join Call
              </button>
            )}
            
            <div className="w-px bg-gray-200" />
            
            {onReschedule && (
              <button 
                className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                onClick={onReschedule}
              >
                Reschedule
              </button>
            )}
            
            <div className="w-px bg-gray-200" />
            
            {onCancel && (
              <button 
                className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </LightThemeCardContent>
    </LightThemeCard>
  );
};

// MedicationCard component for displaying medication information
interface MedicationCardProps {
  name: string;
  dosage: string;
  schedule: string;
  instructions?: string;
  startDate?: string;
  endDate?: string;
  refillDate?: string;
  prescribedBy?: string;
  className?: string;
}

export const LightThemeMedicationCard: React.FC<MedicationCardProps> = ({
  name,
  dosage,
  schedule,
  instructions,
  startDate,
  endDate,
  refillDate,
  prescribedBy,
  className,
}) => {
  return (
    <LightThemeCard className={cn('overflow-hidden', className)}>
      <LightThemeCardContent>
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-blue-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" 
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{dosage}</p>
          </div>
        </div>
        
        <div className="px-3 py-2 bg-gray-50 rounded-md mb-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Schedule: </span>
            {schedule}
          </p>
        </div>
        
        {instructions && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Instructions:</p>
            <p className="text-sm text-gray-600">{instructions}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          {startDate && (
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="font-medium text-gray-700">{startDate}</p>
            </div>
          )}
          
          {endDate && (
            <div>
              <p className="text-gray-500">End Date</p>
              <p className="font-medium text-gray-700">{endDate}</p>
            </div>
          )}
          
          {refillDate && (
            <div>
              <p className="text-gray-500">Refill Date</p>
              <p className="font-medium text-gray-700">{refillDate}</p>
            </div>
          )}
          
          {prescribedBy && (
            <div>
              <p className="text-gray-500">Prescribed By</p>
              <p className="font-medium text-gray-700">{prescribedBy}</p>
            </div>
          )}
        </div>
      </LightThemeCardContent>
    </LightThemeCard>
  );
};

// HealthSummaryCard component for displaying health record summary
interface HealthSummaryCardProps {
  patientName: string;
  patientAge?: string;
  patientAvatar?: React.ReactNode;
  vitalSigns?: Array<{
    name: string;
    value: string | number;
    unit?: string;
    status?: 'normal' | 'warning' | 'critical';
  }>;
  allergies?: string[];
  conditions?: string[];
  className?: string;
}

export const LightThemeHealthSummaryCard: React.FC<HealthSummaryCardProps> = ({
  patientName,
  patientAge,
  patientAvatar,
  vitalSigns,
  allergies,
  conditions,
  className,
}) => {
  return (
    <LightThemeCard className={cn('overflow-hidden', className)}>
      <LightThemeCardContent>
        <div className="flex items-center mb-4">
          {patientAvatar ? (
            <div className="mr-3">
              {patientAvatar}
            </div>
          ) : (
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-blue-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                />
              </svg>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{patientName}</h3>
            {patientAge && (
              <p className="text-sm text-gray-500">{patientAge}</p>
            )}
          </div>
        </div>
        
        {vitalSigns && vitalSigns.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Vital Signs</h4>
            <div className="grid grid-cols-2 gap-2">
              {vitalSigns.map((vitalSign, index) => {
                const statusColors = {
                  normal: 'text-green-600',
                  warning: 'text-yellow-600',
                  critical: 'text-red-600',
                };
                
                return (
                  <div key={index} className="bg-gray-50 p-2 rounded-md">
                    <p className="text-xs text-gray-500">{vitalSign.name}</p>
                    <p className={cn(
                      'font-semibold',
                      vitalSign.status ? statusColors[vitalSign.status] : 'text-gray-900'
                    )}>
                      {vitalSign.value}
                      {vitalSign.unit && <span className="text-xs ml-1">{vitalSign.unit}</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          {allergies && allergies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Allergies</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {allergies.map((allergy, index) => (
                  <li key={index} className="flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2" />
                    {allergy}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {conditions && conditions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Conditions</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {conditions.map((condition, index) => (
                  <li key={index} className="flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2" />
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </LightThemeCardContent>
    </LightThemeCard>
  );
};