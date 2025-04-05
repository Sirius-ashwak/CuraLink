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

  // Color values for dynamic animation
  const colorValues = {
    default: {
      primary: '#7c3aed', // purple-600 fallback
      lighter: '#a78bfa', // purple-400 fallback
      lightest: '#c4b5fd' // purple-300 fallback
    },
    appointment: {
      primary: '#3b82f6', // blue-500
      lighter: '#60a5fa', // blue-400
      lightest: '#93c5fd' // blue-300
    },
    emergency: {
      primary: '#ef4444', // red-500
      lighter: '#f87171', // red-400
      lightest: '#fca5a5' // red-300
    },
    consultation: {
      primary: '#22c55e', // green-500
      lighter: '#4ade80', // green-400
      lightest: '#86efac' // green-300
    }
  };

  const variants = {
    default: {
      colors: {
        primary: 'text-primary',
        secondary: 'text-primary/70',
        accent: 'text-primary/40'
      },
      icon: <Loader2 className="h-full w-full" />,
      colorValues: colorValues.default
    },
    appointment: {
      colors: {
        primary: 'text-blue-500 dark:text-blue-400',
        secondary: 'text-blue-400 dark:text-blue-300',
        accent: 'text-blue-300 dark:text-blue-200'
      },
      icon: <Shield className="h-full w-full" />,
      colorValues: colorValues.appointment
    },
    emergency: {
      colors: {
        primary: 'text-red-500 dark:text-red-400',
        secondary: 'text-red-400 dark:text-red-300',
        accent: 'text-red-300 dark:text-red-200'
      },
      icon: <Activity className="h-full w-full" />,
      colorValues: colorValues.emergency
    },
    consultation: {
      colors: {
        primary: 'text-green-500 dark:text-green-400',
        secondary: 'text-green-400 dark:text-green-300',
        accent: 'text-green-300 dark:text-green-200'
      },
      icon: <Heart className="h-full w-full" />,
      colorValues: colorValues.consultation
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
              'absolute inset-0 rounded-full bg-muted opacity-30',
              selectedVariant.colors.accent
            )}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ 
              duration: 1.8, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            animate={{ rotate: [0, 360] }}
            transition={{ 
              duration: 3.5,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <svg 
              viewBox="0 0 100 100" 
              className="h-full w-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke={selectedVariant.colorValues.primary}
                strokeWidth="3"
                strokeDasharray="283"
                animate={{ 
                  strokeDashoffset: [283, 0, 283],
                  strokeWidth: [2, 3, 2],
                  stroke: [
                    selectedVariant.colorValues.primary,
                    selectedVariant.colorValues.lighter,
                    selectedVariant.colorValues.primary,
                  ]
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
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: selectedVariant.colorValues.primary }}
            animate={{ 
              scale: [1, 1.15, 1],
              y: [0, -2, 0],
              color: [
                selectedVariant.colorValues.primary,
                selectedVariant.colorValues.lighter,
                selectedVariant.colorValues.primary
              ],
              filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut" 
            }}
          >
            {selectedVariant.icon}
          </motion.div>

          {/* Small pulsing dots around the character */}
          <motion.div 
            className="absolute h-3 w-3 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: selectedVariant.colorValues.lighter }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8],
              backgroundColor: [
                selectedVariant.colorValues.lighter,
                selectedVariant.colorValues.primary,
                selectedVariant.colorValues.lighter
              ]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 0.5,
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="absolute h-3 w-3 rounded-full bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
            style={{ backgroundColor: selectedVariant.colorValues.lighter }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8],
              backgroundColor: [
                selectedVariant.colorValues.lighter,
                selectedVariant.colorValues.primary,
                selectedVariant.colorValues.lighter
              ]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="absolute h-3 w-3 rounded-full left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: selectedVariant.colorValues.lighter }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8],
              backgroundColor: [
                selectedVariant.colorValues.lighter,
                selectedVariant.colorValues.primary,
                selectedVariant.colorValues.lighter
              ]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 1,
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="absolute h-3 w-3 rounded-full right-0 top-1/2 translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: selectedVariant.colorValues.lighter }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8],
              backgroundColor: [
                selectedVariant.colorValues.lighter,
                selectedVariant.colorValues.primary,
                selectedVariant.colorValues.lighter
              ]
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
        style={{ color: selectedVariant.colorValues.primary }}
        animate={{ 
          opacity: [0.5, 1, 0.5],
          y: [0, -1, 0],
          scale: [1, 1.02, 1],
          color: [
            selectedVariant.colorValues.primary,
            selectedVariant.colorValues.lighter,
            selectedVariant.colorValues.primary
          ]
        }}
        transition={{ 
          duration: 1.8, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
      >
        {message}
      </motion.p>
    </div>
  );
}