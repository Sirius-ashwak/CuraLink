import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HealthMascot } from './health-mascot';
import { LoadingMascot } from './loading-mascot';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  type?: 'minimal' | 'full' | 'overlay';
  variant?: 'default' | 'appointment' | 'emergency' | 'consultation';
  showMascot?: boolean;
  showSpinner?: boolean;
  className?: string;
}

export function LoadingScreen({
  message = 'Loading...',
  submessage,
  type = 'minimal',
  variant = 'default',
  showMascot = true,
  showSpinner = true,
  className
}: LoadingScreenProps) {
  
  const variantColorMap = {
    default: 'primary',
    appointment: 'blue',
    emergency: 'red',
    consultation: 'green',
  } as const;

  // Minimal loading indicator (used within components)
  if (type === 'minimal') {
    return (
      <div className={cn('flex flex-col items-center justify-center p-4', className)}>
        {showMascot && showSpinner ? (
          <LoadingMascot 
            message={message} 
            variant={variant} 
            size="sm" 
          />
        ) : showMascot ? (
          <div className="flex flex-col items-center">
            <HealthMascot 
              size="sm" 
              color={variantColorMap[variant]} 
            />
            <p className="mt-3 text-sm font-medium">{message}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-3 text-sm font-medium">{message}</p>
          </div>
        )}
      </div>
    );
  }

  // Overlay loading screen (with semi-transparent background)
  if (type === 'overlay') {
    return (
      <motion.div 
        className={cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm',
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center justify-center text-center">
          {showMascot ? (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 0.6
              }}
            >
              <HealthMascot 
                size="lg" 
                color={variantColorMap[variant]} 
                animate={true}
              />
            </motion.div>
          ) : null}
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: 0.2, 
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            <h3 className="mt-6 text-2xl font-bold">{message}</h3>
            {submessage && (
              <motion.p 
                className="mt-2 text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {submessage}
              </motion.p>
            )}
          </motion.div>

          {showSpinner && (
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: 0.3,
                duration: 0.5,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
            >
              <LoadingMascot 
                message="" 
                variant={variant} 
                size="sm" 
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  // Full-page loading screen
  return (
    <div className={cn(
      'flex min-h-[60vh] flex-col items-center justify-center',
      className
    )}>
      <div className="flex flex-col items-center justify-center text-center">
        {showMascot && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.6,
              type: "spring",
              stiffness: 220,
              damping: 20
            }}
          >
            <HealthMascot 
              size="lg" 
              color={variantColorMap[variant]} 
              animate={true}
            />
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: 0.2, 
            duration: 0.5,
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
        >
          <h2 className="mt-6 text-3xl font-bold tracking-tight">{message}</h2>
          {submessage && (
            <motion.p 
              className="mt-2 text-xl text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {submessage}
            </motion.p>
          )}
        </motion.div>

        {showSpinner && (
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.3, 
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
          >
            <LoadingMascot 
              message="" 
              variant={variant} 
              size="md" 
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}