"use client";

import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface MaskProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function Masquerade({ size = 120, className, opacity = 1 }: MaskProps) {
  const { colors } = useTheme();

  return (
    <svg 
      width={size} height={size} 
      viewBox="0 0 100 100" fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className} opacity={opacity}
    >
      {/* Background Y2K Tech Orbit Rings */}
      <circle cx="50" cy="50" r="44" stroke={colors.accent} strokeWidth="1" strokeDasharray="4 4" />
      <ellipse cx="50" cy="50" rx="42" ry="18" stroke={colors.accent} strokeWidth="1.5" transform="rotate(25 50 50)" />

      {/* 
        Tilt the entire mask slightly for a rakish Y2K look 
      */}
      <g transform="rotate(-8, 50, 50)">
        
        {/* RIBBONS - Sharp zigzag ties */}
        <path d="M 15 48 L 5 70 L 10 95" fill="none" stroke={colors.neutral} strokeWidth="2.5" strokeLinecap="square" />
        <path d="M 85 48 L 95 70 L 90 95" fill="none" stroke={colors.neutral} strokeWidth="2.5" strokeLinecap="square" />

        {/* FEATHERS - Sharp geometric arrow shapes */}
        {/* Feather 1 (Long, arching left) */}
        <polygon 
          points="75,38 55,2 25,12 55,20" 
          fill={colors.secondary} stroke={colors.baseContent} strokeWidth="2.5" strokeLinejoin="miter"
        />
        {/* Feather 1 Spine */}
        <path d="M 75 38 L 40 10" fill="none" stroke={colors.accent} strokeWidth="1.5" />

        {/* Feather 2 (Shorter, arching right) */}
        <polygon 
          points="78,40 102,10 95,32 85,35" 
          fill={colors.accent} stroke={colors.baseContent} strokeWidth="2.5" strokeLinejoin="miter"
        />
        {/* Feather 2 Spine */}
        <path d="M 78 40 L 92 21" fill="none" stroke={colors.primary} strokeWidth="1.5" />

        {/* 
          MAIN MASK BASE & EYE HOLES 
          Sharp polygonal contours, sharp diamond eye cutouts.
          Uses evenodd to punch clean holes through the mask.
        */}
        <path 
          fillRule="evenodd" 
          clipRule="evenodd"
          d="
            M 15,40 
            L 50,22 
            L 85,40 
            L 92,60 
            L 80,68 
            L 50,55 
            L 20,68 
            L 8,60 
            Z
            
            M 22,46 L 32,38 L 42,46 L 32,54 Z
            M 58,46 L 68,38 L 78,46 L 68,54 Z
          "
          fill={colors.base100} 
          stroke={colors.primary} 
          strokeWidth="3.5" 
          strokeLinejoin="miter"
        />

        {/* DECORATIVE TRIM / FILIGREE - Sharp lines and diamond accents */}
        <path d="M 50,28 L 62,25 L 70,35" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="square" />
        <path d="M 50,28 L 38,25 L 30,35" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="square" />
        
        {/* Diamond accents */}
        <polygon points="50,30 52,33 50,36 48,33" fill={colors.accent} />
        <polygon points="28,58 30,60 28,62 26,60" fill={colors.accent} />
        <polygon points="72,58 74,60 72,62 70,60" fill={colors.accent} />
      </g>

      {/* Y2K Starburst Sparkle (top left) */}
      <path 
        d="M 18 12 Q 18 19 11 19 Q 18 19 18 26 Q 18 19 25 19 Q 18 19 18 12 Z" 
        fill={colors.accent} 
        stroke={colors.baseContent}
        strokeWidth="1.5"
      />
    </svg>
  );
}
