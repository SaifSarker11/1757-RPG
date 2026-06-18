import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface ScaleProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function BalanceScale({ size = 120, className, opacity = 1 }: ScaleProps) {
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
      {/* 
        BASE AND PILLAR 
        The sturdy core of the scale 
      */}
      {/* Pedestal Base */}
      <path 
        d="M 35 90 L 65 90 L 55 80 L 45 80 Z" 
        fill={colors.scaleBase} 
        stroke={colors.scaleHighlight}
        strokeWidth="1"
      />
      {/* Central Pillar */}
      <rect x="47" y="20" width="6" height="60" fill={colors.scaleBase} />
      {/* Pillar Highlight line for 3D cylinder effect */}
      <rect x="48" y="20" width="2" height="60" fill={colors.scaleHighlight} opacity="0.5" />
      {/* Top Finial (The round knob on top) */}
      <circle cx="50" cy="15" r="5" fill={colors.scaleHighlight} />

      {/* 
        THE BALANCE BEAM AND PLATES
        We wrap this in a group with a subtle rotation animation.
        This gives the illusion that the scale is actively measuring weight!
      */}
      <g>
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="-3 50 25; 3 50 25; -3 50 25" 
          dur="8s" 
          repeatCount="indefinite" 
        />
        
        {/* The Horizontal Beam */}
        <rect x="20" y="23" width="60" height="4" rx="2" fill={colors.scaleHighlight} />

        {/* LEFT PLATE ASSEMBLY */}
        <g>
          {/* Strings/Chains holding the plate */}
          <path d="M 22 27 L 15 55 M 22 27 L 29 55" stroke={colors.scaleStrings} strokeWidth="1.5" />
          {/* The Plate / Bowl */}
          <path d="M 10 55 Q 22 65 34 55 Z" fill={colors.scalePlates} />
          {/* Plate inner shadow/depth */}
          <path d="M 12 55 Q 22 60 32 55 Z" fill={colors.scaleHighlight} opacity="0.3" />
        </g>

        {/* RIGHT PLATE ASSEMBLY */}
        <g>
          {/* Strings/Chains holding the plate */}
          <path d="M 78 27 L 71 55 M 78 27 L 85 55" stroke={colors.scaleStrings} strokeWidth="1.5" />
          {/* The Plate / Bowl */}
          <path d="M 66 55 Q 78 65 90 55 Z" fill={colors.scalePlates} />
          {/* Plate inner shadow/depth */}
          <path d="M 68 55 Q 78 60 88 55 Z" fill={colors.scaleHighlight} opacity="0.3" />
        </g>
      </g>
    </svg>
  );
}
