import React from 'react';
import { Loader2, Heart, Shield, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LoadingMascotProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'appointment' | 'emergency' | 'consultation';
  className?: string;
}

export function LoadingMascot({
  message = 'Loading...',
  size = 'md',
  variant = 'default',
  className
}: LoadingMascotProps) {
  const sizeMap = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };
  
  const textSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  const variants = {
    default: {
      colors: {
        primary: 'text-primary',
        secondary: 'text-primary/70',
        accent: 'text-primary/40'
      },
      icon: <Loader2 className="h-full w-full" />
    },
    appointment: {
      colors: {
        primary: 'text-blue-500 dark:text-blue-400',
        secondary: 'text-blue-400 dark:text-blue-300',
        accent: 'text-blue-300 dark:text-blue-200'
      },
      icon: <Shield className="h-full w-full" />
    },
    emergency: {
      colors: {
        primary: 'text-red-500 dark:text-red-400',
        secondary: 'text-red-400 dark:text-red-300',
        accent: 'text-red-300 dark:text-red-200'
      },
      icon: <Activity className="h-full w-full" />
    },
    consultation: {
      colors: {
        primary: 'text-green-500 dark:text-green-400',
        secondary: 'text-green-400 dark:text-green-300',
        accent: 'text-green-300 dark:text-green-200'
      },
      icon: <Heart className="h-full w-full" />
    }
  };

  const selectedVariant = variants[variant];

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className="relative">
        {/* Main Doctor/Nurse Character */}
        <div className={cn('relative', sizeMap[size])}>
          <motion.div 
            className={cn(
              'absolute inset-0 rounded-full bg-muted opacity-20',
              selectedVariant.colors.accent
            )}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: [0, 360] }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <svg 
              viewBox="0 0 100 100" 
              className="h-full w-full text-primary"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                strokeDasharray="283"
                animate={{ 
                  strokeDashoffset: [283, 0, 283]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              />
            </svg>
          </motion.div>

          {/* Mascot Icon in the Middle */}
          <motion.div 
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              selectedVariant.colors.primary
            )}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut" 
            }}
          >
            {selectedVariant.icon}
          </motion.div>

          {/* Small pulsing dots around the character */}
          <motion.div 
            className={cn(
              "absolute h-3 w-3 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
              selectedVariant.colors.secondary
            )}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 0.5,
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className={cn(
              "absolute h-3 w-3 rounded-full bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
              selectedVariant.colors.secondary
            )}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className={cn(
              "absolute h-3 w-3 rounded-full left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
              selectedVariant.colors.secondary
            )}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 1,
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className={cn(
              "absolute h-3 w-3 rounded-full right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
              selectedVariant.colors.secondary
            )}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 1.5,
              ease: "easeInOut" 
            }}
          />
        </div>
      </div>

      {/* Loading Text */}
      <motion.p 
        className={cn("mt-4 text-center font-medium", textSizeMap[size])}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      >
        {message}
      </motion.p>
    </div>
  );
}