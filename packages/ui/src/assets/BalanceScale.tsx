"use client";

import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface ScaleProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function BalanceScale({ size = 120, className, opacity = 1 }: ScaleProps) {
  const { colors } = useTheme();

  return (
    <svg 
      width={size} height={size} 
      viewBox="0 0 100 100" fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className} opacity={opacity}
    >
      {/* Background Y2K Tech concentric starburst/rings */}
      <circle cx="50" cy="50" r="42" stroke={colors.accent} strokeWidth="1" strokeDasharray="3 6" />
      
      {/* 
        PEDESTAL BASE - Sharp futuristic double-layer triangle
      */}
      <polygon 
        points="32,90 68,90 58,78 42,78" 
        fill={colors.neutral} stroke={colors.baseContent} strokeWidth="3" strokeLinejoin="miter"
      />
      <polygon 
        points="40,78 60,78 50,22" 
        stroke={colors.accent} strokeWidth="1.5" strokeDasharray="4 4"
      />

      {/* Central Pillar - Sharp polygon */}
      <polygon 
        points="46,25 54,25 53,80 47,80" 
        fill={colors.neutral} stroke={colors.baseContent} strokeWidth="2.5" strokeLinejoin="miter"
      />
      
      {/* Top Pivot Pin - Starburst Sparkle */}
      <path 
        d="M 50 14 Q 50 20 44 20 Q 50 20 50 26 Q 50 20 56 20 Q 50 20 50 14 Z" 
        fill={colors.accent} stroke={colors.baseContent} strokeWidth="1.5" 
      />

      {/* 
        THE BALANCE BEAM AND PLATES
        Animated rotational drift around pivot (50, 25)
      */}
      <g>
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="-5 50 25; 5 50 25; -5 50 25" 
          dur="6s" 
          repeatCount="indefinite" 
        />
        
        {/* The Horizontal Beam - Sharp polygonal arm with arrows on ends */}
        <polygon 
          points="20,22 80,22 83,25 80,28 20,28 17,25" 
          fill={colors.primary} stroke={colors.baseContent} strokeWidth="3" strokeLinejoin="miter"
        />
        
        {/* Left hanging strings - sharp straight lines */}
        <path d="M 22 28 L 12 55 M 22 28 L 32 55" stroke={colors.baseContent} strokeWidth="2" strokeLinecap="square" />
        {/* Left Plate - Sharp double trapezoid bowl */}
        <polygon points="10,55 34,55 28,68 16,68" fill={colors.secondary} stroke={colors.baseContent} strokeWidth="3" strokeLinejoin="miter" />
        <polygon points="14,58 30,58 26,65 18,65" fill={colors.accent} />

        {/* Right hanging strings - sharp straight lines */}
        <path d="M 78 28 L 68 55 M 78 28 L 88 55" stroke={colors.baseContent} strokeWidth="2" strokeLinecap="square" />
        {/* Right Plate - Sharp double trapezoid bowl */}
        <polygon points="66,55 90,55 84,68 72,68" fill={colors.secondary} stroke={colors.baseContent} strokeWidth="3" strokeLinejoin="miter" />
        <polygon points="70,58 86,58 82,65 74,65" fill={colors.accent} />
      </g>

      {/* Floating Sparkles to balance the composition */}
      <path 
        d="M 18 12 Q 18 17 13 17 Q 18 17 18 22 Q 18 17 23 17 Q 18 17 18 12 Z" 
        fill={colors.accent} stroke={colors.baseContent} strokeWidth="1" 
      />
      <path 
        d="M 82 12 Q 82 17 77 17 Q 82 17 82 22 Q 82 17 87 17 Q 82 17 82 12 Z" 
        fill={colors.accent} stroke={colors.baseContent} strokeWidth="1" 
      />
    </svg>
  );
}
