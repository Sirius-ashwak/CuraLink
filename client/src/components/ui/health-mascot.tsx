import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HealthMascotProps {
  className?: string;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'blue' | 'green' | 'red' | 'orange';
}

export function HealthMascot({ 
  className, 
  animate = true, 
  size = 'md',
  color = 'primary'
}: HealthMascotProps) {
  const sizeMap = {
    sm: 'h-24 w-24',
    md: 'h-32 w-32',
    lg: 'h-48 w-48',
  };

  // Enhanced color maps with glow effects
  const colorMap = {
    primary: 'text-primary',
    blue: 'text-blue-500 dark:text-blue-400',
    green: 'text-green-500 dark:text-green-400',
    red: 'text-red-500 dark:text-red-400',
    orange: 'text-orange-500 dark:text-orange-400',
  };

  const glowColorMap = {
    primary: 'rgba(124, 58, 237, 0.6)', // purple glow
    blue: 'rgba(14, 165, 233, 0.6)',    // blue glow
    green: 'rgba(16, 185, 129, 0.6)',   // green glow
    red: 'rgba(239, 68, 68, 0.6)',      // red glow 
    orange: 'rgba(249, 115, 22, 0.6)',  // orange glow
  };

  return (
    <div className={cn('relative', sizeMap[size], colorMap[color], className)}>
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        {/* SVG Filters for Glow Effects */}
        <defs>
          <filter id="glow-effect">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Head shape with glow */}
        <motion.circle
          cx="100"
          cy="70"
          r="50"
          fill="currentColor"
          filter="url(#glow-effect)"
          animate={animate ? { 
            scale: [1, 1.05, 1],
            y: [0, -3, 0],
            filter: [
              "url(#glow-effect) brightness(1)",
              "url(#glow-effect) brightness(1.2)",
              "url(#glow-effect) brightness(1)"
            ]
          } : undefined}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />

        {/* Face - White area */}
        <circle cx="100" cy="75" r="42" fill="white" />

        {/* Eyes */}
        <g>
          {/* Left eye */}
          <motion.circle
            cx="80"
            cy="65"
            r="8"
            fill="#333"
            animate={animate ? 
              { 
                scaleY: [1, 0.2, 1],
                translateY: [0, 2, 0]
              } : undefined
            }
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut'
            }}
          />
          
          {/* Right eye */}
          <motion.circle
            cx="120"
            cy="65"
            r="8"
            fill="#333"
            animate={animate ? 
              { 
                scaleY: [1, 0.2, 1],
                translateY: [0, 2, 0]
              } : undefined
            }
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut'
            }}
          />
          
          {/* Eye highlights */}
          <circle cx="83" cy="63" r="2" fill="white" />
          <circle cx="123" cy="63" r="2" fill="white" />
        </g>

        {/* Smile */}
        <motion.path
          d="M75,90 Q100,110 125,90"
          stroke="#333"
          strokeWidth="3"
          fill="transparent"
          strokeLinecap="round"
          animate={animate ? 
            { d: ["M75,90 Q100,110 125,90", "M75,95 Q100,115 125,95", "M75,90 Q100,110 125,90"] } : undefined
          }
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />

        {/* Nurse/Doctor Cap */}
        <motion.path
          d="M50,50 L150,50 L140,35 L60,35 Z"
          fill="white"
          stroke="currentColor"
          strokeWidth="2"
          animate={animate ? { y: [0, -2, 0] } : undefined}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        />
        
        {/* Red Cross on Cap with Glow Effect */}
        <motion.g
          filter="url(#glow-effect)"
          animate={animate ? { 
            scale: [1, 1.1, 1], 
            opacity: [0.8, 1, 0.8],
            filter: [
              "url(#glow-effect) brightness(1)",
              "url(#glow-effect) brightness(1.5)",
              "url(#glow-effect) brightness(1)"
            ]
          } : undefined}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }}
        >
          <motion.rect 
            x="95" y="38" width="10" height="20" rx="2" 
            fill="#FF5555"
            animate={animate ? { fill: ["#FF5555", "#FF7777", "#FF5555"] } : undefined}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <motion.rect 
            x="90" y="43" width="20" height="10" rx="2" 
            fill="#FF5555"
            animate={animate ? { fill: ["#FF5555", "#FF7777", "#FF5555"] } : undefined}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.g>

        {/* Body/Lab Coat */}
        <path
          d="M70,120 L60,170 H140 L130,120"
          fill="white"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M70,120 C70,100 130,100 130,120"
          fill="white"
          stroke="currentColor"
          strokeWidth="2"
        />
        
        {/* Stethoscope */}
        <motion.g
          fill="none"
          stroke="#555"
          strokeWidth="3"
          animate={animate ? { 
            rotate: [0, 3, 0, -3, 0], 
            x: [0, 2, 0, -2, 0],
            y: [0, 1, 0, 1, 0]
          } : undefined}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{ transformOrigin: 'center' }}
        >
          <path
            d="M85,130 C85,150 115,150 115,130"
            strokeLinecap="round"
          />
          <motion.circle 
            cx="85" 
            cy="125" 
            r="5" 
            stroke="#555" 
            fill="#888"
            animate={animate ? { scale: [1, 1.2, 1] } : undefined}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.g>

        {/* Heartbeat Line with Glow */}
        <motion.path
          d="M75,160 L85,160 L90,145 L95,175 L100,155 L105,165 L110,160 L125,160"
          fill="none"
          stroke="#FF5555"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#glow-effect)"
          animate={animate ? { 
            pathLength: [0, 1], 
            opacity: [0, 1],
            strokeWidth: [2, 3, 2],
            stroke: ["#FF5555", "#FF7777", "#FF5555"],
            filter: [
              "url(#glow-effect) brightness(1)",
              "url(#glow-effect) brightness(1.5)",
              "url(#glow-effect) brightness(1)"
            ]
          } : undefined}
          transition={{ 
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Pocket */}
        <rect x="85" y="140" width="30" height="15" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
        
        {/* Pen in pocket */}
        <motion.rect
          x="90"
          y="135"
          width="2"
          height="15"
          fill="#555"
          animate={animate ? { y: [135, 136, 135] } : undefined}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </svg>
    </div>
  );
}