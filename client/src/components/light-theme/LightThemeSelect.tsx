import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export const LightThemeSelect: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled,
  error,
  label,
  helperText,
  className,
  id,
  name,
  required,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  
  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    
    setSelectedValue(option.value);
    onChange?.(option.value);
    setIsOpen(false);
  };
  
  const selectedOption = options.find(option => option.value === selectedValue);
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={id} 
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          id={id}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "w-full px-4 py-2.5 text-left text-gray-900 bg-white border rounded-md focus:outline-none",
            "transition-colors duration-200 flex items-center justify-between",
            error 
              ? "border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500" 
              : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-500",
            disabled && "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200",
            className
          )}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span className={cn(!selectedValue && "text-gray-400")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg 
            className={cn(
              "w-5 h-5 text-gray-400 transition-transform duration-200", 
              isOpen && "transform rotate-180"
            )} 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
        
        {isOpen && (
          <div 
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            <ul className="py-1">
              {options.map((option, index) => (
                <li
                  key={index}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "px-4 py-2 cursor-pointer text-gray-900 hover:bg-blue-50 hover:text-blue-700",
                    "transition-colors duration-150",
                    option.disabled && "text-gray-400 cursor-not-allowed hover:bg-transparent hover:text-gray-400",
                    option.value === selectedValue && "bg-blue-50 text-blue-700 font-medium"
                  )}
                  aria-selected={option.value === selectedValue}
                  role="option"
                >
                  {option.label}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <input 
          type="hidden" 
          name={name} 
          value={selectedValue} 
          required={required}
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