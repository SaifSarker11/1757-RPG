"use client";

import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface GoldCoinProps {
  size?: number;
  className?: string;
  opacity?: number; 
}

export function GoldCoin({ size = 64, className, opacity = 1 }: GoldCoinProps) {
  const { colors } = useTheme();

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
      {/* Y2K Outer Starburst Glow (Sharp decorative rays) */}
      <path 
        d="M 50 5 L 54 35 L 84 15 L 65 40 L 95 50 L 65 60 L 84 85 L 54 65 L 50 95 L 46 65 L 16 85 L 35 60 L 5 50 L 35 40 L 16 15 L 46 35 Z" 
        fill={colors.accent} 
        stroke={colors.baseContent}
        strokeWidth="2.5"
        strokeLinejoin="miter"
      />

      {/* Main Coin Body - Octagonal / Sharp edged */}
      <polygon 
        points="50,15 75,25 85,50 75,75 50,85 25,75 15,50 25,25"
        fill={colors.primary} 
        stroke={colors.baseContent}
        strokeWidth="3.5"
        strokeLinejoin="miter"
      />
      
      {/* Inner Decorative Octagon */}
      <polygon 
        points="50,22 69,30 78,50 69,70 50,78 31,70 22,50 31,30"
        fill={colors.secondary} 
        stroke={colors.baseContent}
        strokeWidth="2"
        strokeLinejoin="miter"
      />

      {/* Y2K Vectorheart / 4-Point Star Core */}
      <path 
        d="M 50 30 Q 50 50 30 50 Q 50 50 50 70 Q 50 50 70 50 Q 50 50 50 30 Z" 
        fill={colors.base100} 
        stroke={colors.baseContent}
        strokeWidth="2.5"
        strokeLinejoin="miter"
      />
      
      {/* Extra Tech Sparkles */}
      <circle cx="50" cy="50" r="3" fill={colors.accent} stroke={colors.baseContent} strokeWidth="1" />
    </svg>
  );
}
