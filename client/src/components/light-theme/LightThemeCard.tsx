import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'flat';
}

export const LightThemeCard: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'rounded-lg overflow-hidden';
  
  const variantStyles = {
    default: 'bg-white shadow-sm',
    elevated: 'bg-white shadow-md',
    bordered: 'bg-white border border-gray-200',
    flat: 'bg-gray-50',
  };
  
  const cardClasses = cn(
    baseStyles,
    variantStyles[variant],
    className
  );
  
  return (
    <div 
      className={cardClasses} 
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const LightThemeCardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div 
      className={cn('p-6 pb-4 border-b border-gray-100', className)} 
      {...props}
    >
      {children}
    </div>
  );
};

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const LightThemeCardTitle: React.FC<CardTitleProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3 
      className={cn('text-lg font-semibold text-gray-900', className)} 
      {...props}
    >
      {children}
    </h3>
  );
};

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

export const LightThemeCardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p 
      className={cn('text-sm text-gray-500 mt-1', className)} 
      {...props}
    >
      {children}
    </p>
  );
};

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const LightThemeCardContent: React.FC<CardContentProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div 
      className={cn('p-6', className)} 
      {...props}
    >
      {children}
    </div>
  );
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const LightThemeCardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div 
      className={cn('p-6 pt-0 flex justify-end gap-2', className)} 
      {...props}
    >
      {children}
    </div>
  );
};