import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface ShackleProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function Shackles({ size = 120, className, opacity = 1 }: ShackleProps) {
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
        {/* Glow effect specifically for the cyberpunk energy tether chains */}
        <filter id="energyGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 
        CENTRAL CHAIN / ENERGY TETHER
        Uses a thick dashed line to simulate chain links. 
        In cyberpunk theme, it looks like a pulsing laser tether.
      */}
      <path 
        d="M 30 65 Q 50 95 70 65" 
        fill="none" 
        stroke={colors.shackleChain} 
        strokeWidth="6" 
        strokeDasharray="8 6" 
        strokeLinecap="round" 
        filter="url(#energyGlow)"
      />
      {/* Inner chain ring connector shadow to give 3D depth to the links */}
      <path 
        d="M 30 65 Q 50 95 70 65" 
        fill="none" 
        stroke={colors.shackleShadow} 
        strokeWidth="2" 
        strokeDasharray="14 14" 
        strokeLinecap="round" 
      />

      {/* LEFT CUFF */}
      <g>
        {/* Back Half of Cuff (Interior) */}
        <path 
          d="M 12 55 A 15 8 0 0 1 38 55" 
          fill="none" 
          stroke={colors.shackleShadow} 
          strokeWidth="6" 
          strokeLinecap="round" 
        />
        {/* Front Half of Cuff (Exterior) */}
        <path 
          d="M 10 55 A 15 8 0 0 0 40 55" 
          fill="none" 
          stroke={colors.shackleBase} 
          strokeWidth="8" 
          strokeLinecap="round" 
        />
        {/* Cuff Lock Mechanism */}
        <rect x="20" y="60" width="10" height="6" rx="1" fill={colors.shackleHighlight} />
        {/* Keyhole */}
        <circle cx="25" cy="63" r="1.5" fill={colors.shackleShadow} />
      </g>

      {/* RIGHT CUFF (Broken/Open state for dramatic effect) */}
      <g>
        {/* Back Half of Cuff */}
        <path 
          d="M 62 55 A 15 8 0 0 1 88 55" 
          fill="none" 
          stroke={colors.shackleShadow} 
          strokeWidth="6" 
          strokeLinecap="round" 
        />
        {/* Front Half of Cuff - Only drawing the bottom part because it's swung open! */}
        <path 
          d="M 60 55 A 15 8 0 0 0 78 62" 
          fill="none" 
          stroke={colors.shackleBase} 
          strokeWidth="8" 
          strokeLinecap="round" 
        />
        
        {/* The broken top part of the front cuff, swung down */}
        <path 
          d="M 78 62 L 92 68" 
          fill="none" 
          stroke={colors.shackleBase} 
          strokeWidth="8" 
          strokeLinecap="round" 
        />
        
        {/* Cuff Lock Mechanism attached to the broken hinge */}
        <rect x="65" y="58" width="10" height="6" rx="1" fill={colors.shackleHighlight} transform="rotate(15, 65, 58)" />
      </g>
    </svg>
  );
}
