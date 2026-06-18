"use client";

import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface EyeProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function EyeOfHorus({ size = 120, className, opacity = 1 }: EyeProps) {
  const { colors } = useTheme();

  return (
    <svg 
      width={size} height={size} 
      viewBox="0 0 100 100" fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className} opacity={opacity}
    >
      {/* Background Y2K Tech Grid lines */}
      <path d="M 50 5 L 50 95 M 5 50 L 95 50" stroke={colors.accent} strokeWidth="1" strokeDasharray="3 6" opacity="0.4" />

      {/* The All-Seeing Triangle / Pyramid (Providence background) - Sharp double-bordered */}
      <polygon 
        points="50,5 95,85 5,85" 
        stroke={colors.accent} strokeWidth="3" 
        fill={colors.accent} fillOpacity="0.1"
      />
      <polygon 
        points="50,15 88,80 12,80" 
        stroke={colors.primary} strokeWidth="1.5" 
      />

      {/* The Sclera - Sharp diamond-almond shape */}
      <polygon 
        points="20,50 50,32 80,50 50,68" 
        fill={colors.base100} stroke={colors.primary} strokeWidth="3" 
      />

      {/* The Iris - Octagonal / sharp */}
      <polygon 
        points="42,50 45,42 50,38 55,42 58,50 55,58 50,62 45,58"
        fill={colors.primary} stroke={colors.baseContent} strokeWidth="1.5"
      />

      {/* The Pupil */}
      <polygon 
        points="46,50 48,46 50,44 52,46 54,50 52,54 50,56 48,54"
        fill={colors.baseContent} 
      />

      {/* Eye Highlight - Sharp square */}
      <rect x="46" y="44" width="3" height="3" fill={colors.primaryContent} />

      {/* Eye of Horus Signature Markings - Sharp lines with square caps */}
      
      {/* Thick top eyeliner */}
      <path d="M15,50 L50,28 L85,50 L95,50" stroke={colors.primary} strokeWidth="3.5" strokeLinecap="square" fill="none" />
      
      {/* The Divine Brow */}
      <path d="M18,35 L50,15 L82,35" stroke={colors.primary} strokeWidth="3.5" strokeLinecap="square" fill="none" />

      {/* The Teardrop Line */}
      <path d="M42,65 L42,85 L46,85" stroke={colors.primary} strokeWidth="3.5" strokeLinecap="square" fill="none" />

      {/* The Falcon Curl/Tail - Sharp steps */}
      <path d="M55,67 L65,85 L80,85" stroke={colors.primary} strokeWidth="3.5" strokeLinecap="square" fill="none" />
      <polygon points="80,83 83,85 80,87" fill={colors.primary} />

      {/* Y2K Starburst Sparkles at the triangle corners */}
      <path d="M 50 5 Q 50 12 43 12 Q 50 12 50 19 Q 50 12 57 12 Q 50 12 50 5 Z" fill={colors.accent} stroke={colors.baseContent} strokeWidth="1" />
      <path d="M 95 85 Q 95 90 89 90 Q 95 90 95 95 Q 95 90 101 90 Q 95 90 95 85 Z" fill={colors.accent} stroke={colors.baseContent} strokeWidth="1" />
      <path d="M 5 85 Q 5 90 -1 90 Q 5 90 5 95 Q 5 90 11 90 Q 5 90 5 85 Z" fill={colors.accent} stroke={colors.baseContent} strokeWidth="1" />
    </svg>
  );
}
