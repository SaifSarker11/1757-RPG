"use client";

import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface ShackleProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function Shackles({ size = 120, className, opacity = 1 }: ShackleProps) {
  const { colors } = useTheme();

  return (
    <svg 
      width={size} height={size} 
      viewBox="0 0 100 100" fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className} opacity={opacity}
    >
      {/* Background Y2K Tech Grid/Spikes */}
      <path d="M 10 50 L 90 50 M 50 10 L 50 90" stroke={colors.accent} strokeWidth="1" strokeDasharray="2 4" />
      <circle cx="50" cy="50" r="35" stroke={colors.accent} strokeWidth="1.5" strokeDasharray="6 12" />

      {/* 
        SHARP METALLIC CHAINS (Diamond Link Chain)
        Classic Y2K style sharp interlocking diamond polygons.
      */}
      <g stroke={colors.baseContent} strokeWidth="2.5" strokeLinejoin="miter">
        {/* Link 1 */}
        <polygon points="32,58 38,62 32,66 26,62" fill={colors.accent} />
        {/* Link 2 */}
        <polygon points="41,64 47,68 41,72 35,68" fill={colors.primary} />
        {/* Link 3 (Center hanging link) */}
        <polygon points="50,68 56,72 50,76 44,72" fill={colors.accent} />
        {/* Link 4 */}
        <polygon points="59,64 65,68 59,72 53,68" fill={colors.primary} />
        {/* Link 5 */}
        <polygon points="68,58 74,62 68,66 62,62" fill={colors.accent} />
      </g>

      {/* LEFT CUFF (Sharp octagonal cuff) */}
      <g stroke={colors.baseContent} strokeWidth="3" strokeLinejoin="miter">
        {/* Shackle body */}
        <polygon 
          points="8,46 22,36 36,46 36,60 22,70 8,60" 
          fill={colors.neutral} 
        />
        {/* Inner negative space (cuff opening) - sharp hexagon */}
        <polygon 
          points="14,48 22,42 30,48 30,58 22,64 14,58" 
          fill={colors.base100} 
        />
        {/* Lock box */}
        <polygon points="32,48 38,48 38,58 32,58" fill={colors.primary} />
        {/* Keyhole (Sharp diamond cutout) */}
        <polygon points="22,51 24,53 22,55 20,53" fill={colors.baseContent} stroke="none" />
      </g>

      {/* RIGHT CUFF (Shattered / Open Cuff) */}
      <g stroke={colors.baseContent} strokeWidth="3" strokeLinejoin="miter">
        {/* Right shackle body - rotated/hinged open */}
        <g transform="translate(62, 36) rotate(35 0 0)">
          {/* Back jaw */}
          <path d="M 0,0 L 14,-10 L 28,0 L 28,14 L 14,24 L 0,14 Z" fill={colors.neutral} />
          <path d="M 6,2 L 14,-4 L 22,2 L 22,12 L 14,18 L 6,12 Z" fill={colors.base100} />
          
          {/* Swung open front jaw */}
          <g transform="translate(28, 0) rotate(60 0 0)">
            <polygon points="0,0 -4,14 10,24 14,10" fill={colors.neutral} />
            <polygon points="2,2 0,12 8,18 10,8" fill={colors.accent} />
          </g>
          
          {/* Lock latch piece */}
          <polygon points="-2,2 -8,2 -8,12 -2,12" fill={colors.primary} />
        </g>
      </g>

      {/* Y2K 4-Point Star Sparkles */}
      <path 
        d="M 22 28 Q 22 35 15 35 Q 22 35 22 42 Q 22 35 29 35 Q 22 35 22 28 Z" 
        fill={colors.accent} 
        stroke={colors.baseContent}
        strokeWidth="1.5"
      />
      <path 
        d="M 78 22 Q 78 27 73 27 Q 78 27 78 32 Q 78 27 83 27 Q 78 27 78 22 Z" 
        fill={colors.accent} 
        stroke={colors.baseContent}
        strokeWidth="1"
      />
    </svg>
  );
}
