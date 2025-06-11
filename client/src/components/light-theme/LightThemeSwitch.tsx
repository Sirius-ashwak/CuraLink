import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export const LightThemeSwitch: React.FC<SwitchProps> = ({
  checked = false,
  onChange,
  disabled,
  className,
  label,
  description,
  size = 'md',
  ...props
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(event.target.checked);
  };
  
  const baseStyles = 'relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-opacity-75';
  
  const sizeStyles = {
    sm: 'h-5 w-9',
    md: 'h-6 w-11',
    lg: 'h-7 w-14'
  };
  
  const thumbSizeStyles = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4.5 w-4.5',
    lg: 'h-5.5 w-5.5'
  };
  
  const translateStyles = {
    sm: 'translate-x-4',
    md: 'translate-x-5',
    lg: 'translate-x-7'
  };
  
  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex-shrink-0">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            disabled={disabled}
            onChange={handleChange}
            {...props}
          />
          
          <div
            aria-hidden="true"
            className={cn(
              baseStyles,
              sizeStyles[size],
              checked ? 'bg-blue-500' : 'bg-gray-200',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                thumbSizeStyles[size],
                'absolute top-[3px] left-[3px]',
                checked ? translateStyles[size] : 'translate-x-0'
              )}
            />
          </div>
        </div>
      </div>
      
      {(label || description) && (
        <div className="ml-3">
          {label && (
            <span className={cn(
              'font-medium',
              disabled ? 'text-gray-400' : 'text-gray-900',
              size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-sm'
            )}>
              {label}
            </span>
          )}
          
          {description && (
            <p className={cn(
              'text-gray-500',
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs',
              disabled && 'text-gray-400'
            )}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};