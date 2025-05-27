import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  rounded?: boolean;
}

export const LightThemeBadge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
  rounded = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium';
  
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-indigo-100 text-indigo-800',
    outline: 'bg-transparent border border-gray-300 text-gray-800',
  };
  
  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  
  const roundedStyles = rounded 
    ? 'rounded-full' 
    : 'rounded-md';
  
  const badgeClasses = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    roundedStyles,
    className
  );
  
  return (
    <div 
      className={badgeClasses} 
      {...props}
    >
      {children}
    </div>
  );
};