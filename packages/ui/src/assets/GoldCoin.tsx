import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface GoldCoinProps {
  size?: number;
  className?: string;
  // Overrides if needed for specific use cases
  opacity?: number; 
}

export function GoldCoin({ size = 64, className, opacity = 1 }: GoldCoinProps) {
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
      {/* Outer Ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        fill={colors.coinOuter} 
      />
      
      {/* Inner Face */}
      <circle 
        cx="50" 
        cy="50" 
        r="38" 
        fill={colors.coinInner} 
      />
      
      {/* Inner Highlight/Shine (top left) */}
      <path 
        d="M 20 50 A 30 30 0 0 1 50 20 A 32 32 0 0 0 25 50 Z" 
        fill={colors.coinHighlight} 
        opacity="0.6"
      />

      {/* Engraving/Symbol (Diamond shape) */}
      <path 
        d="M 50 32 L 62 50 L 50 68 L 38 50 Z" 
        fill={colors.coinEngraving} 
      />

      {/* Inner Detail Ring */}
      <circle 
        cx="50" 
        cy="50" 
        r="30" 
        stroke={colors.coinEngraving} 
        strokeWidth="1.5" 
        strokeDasharray="4 4"
        fill="none" 
      />
    </svg>
  );
}
