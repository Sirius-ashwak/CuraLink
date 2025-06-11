import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
  label?: string;
  helperText?: string;
}

export const LightThemeInput: React.FC<InputProps> = ({
  className,
  icon,
  error,
  label,
  helperText,
  type = 'text',
  disabled,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            "block w-full px-4 py-2.5 text-gray-900 bg-white border rounded-md focus:outline-none",
            "transition-colors duration-200",
            icon && "pl-10",
            error 
              ? "border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500" 
              : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500",
            disabled && "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200",
            className
          )}
          disabled={disabled}
          {...props}
        />
      </div>
      
      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export const LightThemeTextarea: React.FC<Omit<InputProps, 'type'> & React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className,
  error,
  label,
  helperText,
  disabled,
  rows = 4,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <textarea
        className={cn(
          "block w-full px-4 py-2.5 text-gray-900 bg-white border rounded-md focus:outline-none",
          "transition-colors duration-200",
          error 
            ? "border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500" 
            : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500",
          disabled && "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200",
          className
        )}
        rows={rows}
        disabled={disabled}
        {...props}
      />
      
      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
};