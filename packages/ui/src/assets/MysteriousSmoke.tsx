import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface SmokeProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function MysteriousSmoke({ size = 150, className, opacity = 1 }: SmokeProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      opacity={opacity}
    >
      <defs>
        {/* Soft blur for the mysterious atmospheric haze inside the smoke */}
        <filter id="smokeBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur1" />
          <feGaussianBlur stdDeviation="3" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
          </feMerge>
        </filter>
        
        {/* Heavy outer blur for the glowing ambient aura */}
        <filter id="heavyBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      {/* Deep Shadow Base (anchors the smoke to the ground so it doesn't just look like a floating blob) */}
      <ellipse cx="50" cy="85" rx="35" ry="10" fill={colors.smokeShadow} filter="url(#smokeBlur)" opacity="0.8">
        <animate attributeName="rx" values="35;40;35" dur="6s" repeatCount="indefinite" />
      </ellipse>

      {/* Heavy Haze Aura (Outer Glow that breathes) */}
      <circle cx="50" cy="50" r="35" fill={colors.smokeAura} filter="url(#heavyBlur)" opacity="0.7">
        <animate attributeName="r" values="35;42;35" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0.4;0.7" dur="4s" repeatCount="indefinite" />
      </circle>

      <g filter="url(#smokeBlur)">
        {/* Core Smoke Clouds - These shift position slightly to simulate rolling fog */}
        <circle cx="45" cy="70" r="18" fill={colors.smokeCore} opacity="0.9">
           <animate attributeName="cx" values="45;48;45" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="65" cy="65" r="15" fill={colors.smokeCore} opacity="0.8">
           <animate attributeName="cy" values="65;58;65" dur="6s" repeatCount="indefinite" />
        </circle>
        <circle cx="55" cy="45" r="22" fill={colors.smokeCore} opacity="0.85">
           <animate attributeName="r" values="22;26;22" dur="7s" repeatCount="indefinite" />
        </circle>
        <circle cx="35" cy="50" r="14" fill={colors.smokeCore} opacity="0.7">
           <animate attributeName="cy" values="50;42;50" dur="4s" repeatCount="indefinite" />
        </circle>

        {/* Wispy Tendrils rising up and drifting left/right */}
        <path 
          d="M 45 70 Q 30 50 40 20 T 45 5" 
          stroke={colors.smokeWhisper} 
          strokeWidth="4" 
          strokeLinecap="round" 
          fill="none"
        >
           <animate 
             attributeName="d" 
             values="M 45 70 Q 30 50 40 20 T 45 5; M 45 70 Q 40 50 35 20 T 40 5; M 45 70 Q 30 50 40 20 T 45 5" 
             dur="6s" 
             repeatCount="indefinite" 
           />
        </path>
        
        <path 
          d="M 60 65 Q 75 40 55 15 T 60 2" 
          stroke={colors.smokeWhisper} 
          strokeWidth="5" 
          strokeLinecap="round" 
          fill="none"
        >
           <animate 
             attributeName="d" 
             values="M 60 65 Q 75 40 55 15 T 60 2; M 60 65 Q 65 40 65 15 T 55 2; M 60 65 Q 75 40 55 15 T 60 2" 
             dur="8s" 
             repeatCount="indefinite" 
           />
        </path>

        {/* Small center wisp breaking off */}
        <path 
          d="M 50 50 Q 60 35 50 25 T 48 10" 
          stroke={colors.smokeWhisper} 
          strokeWidth="3" 
          strokeLinecap="round" 
          fill="none" 
          opacity="0.6"
        >
           <animate 
             attributeName="d" 
             values="M 50 50 Q 60 35 50 25 T 48 10; M 50 50 Q 40 35 55 25 T 52 10; M 50 50 Q 60 35 50 25 T 48 10" 
             dur="5s" 
             repeatCount="indefinite" 
           />
        </path>
      </g>
    </svg>
  );
}
