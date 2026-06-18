"use client";

import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface CrownProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function BrokenCrown({ size = 120, className, opacity = 1 }: CrownProps) {
  const { colors } = useTheme();

  return (
    <svg 
      width={size} height={size} 
      viewBox="0 0 100 100" fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className} opacity={opacity}
    >
      {/* Y2K Orbit Tech Rings */}
      <ellipse cx="50" cy="80" rx="35" ry="8" stroke={colors.accent} strokeWidth="1" strokeDasharray="3 3" />
      <ellipse cx="50" cy="80" rx="42" ry="12" stroke={colors.accent} strokeWidth="1.5" />

      {/* 
        RIGHT HALF SHATTERED OFFSET SHADOW (Vector block shadow)
        Instead of fuzzy filter blurs, we use offset duplicate paths!
      */}
      <g transform="translate(8, 6) rotate(14, 70, 70)" stroke="none" fill={colors.neutral} opacity="0.3">
        <path d="M 50 87 Q 67.5 85 85 80 L 90 30 L 70 50 L 50 15 L 48 30 L 55 45 L 45 60 Z" />
      </g>

      {/* LEFT HALF (Intact base) - Sharp edges */}
      <g stroke={colors.baseContent} strokeWidth="3" strokeLinejoin="miter">
        <path d="M 15 80 L 50 87 L 45 60 L 55 45 L 48 30 L 50 15 L 30 50 L 10 30 Z" fill={colors.primary} />
        {/* Left Bottom Band - sharp blocky shape */}
        <polygon points="15,80 50,87 48,77 16,71" fill={colors.accent} />
        {/* Left Jewel - Diamond shape */}
        <polygon points="28,60 32,65 28,70 24,65" fill={colors.secondary} />
      </g>

      {/* RIGHT HALF (Broken off) */}
      <g transform="translate(6, 4) rotate(14, 70, 70)" stroke={colors.baseContent} strokeWidth="3" strokeLinejoin="miter">
        <path d="M 50 87 L 85 80 L 90 30 L 70 50 L 50 15 L 48 30 L 55 45 L 45 60 Z" fill={colors.primary} />
        {/* Right Bottom Band */}
        <polygon points="50,87 85,80 83,70 48,77" fill={colors.accent} />
        {/* Right Jewel - Diamond shape */}
        <polygon points="72,60 76,65 72,70 68,65" fill={colors.secondary} />
        
        {/* Center Jewel - Y2K stylized Vector Heart Centerpiece */}
        {/* Formed by two overlapping triangles and a bottom tip */}
        <g fill={colors.secondary}>
          <polygon points="53,64 57,69 53,74 49,69" />
          <polygon points="49,64 53,69 49,74 45,69" />
          <polygon points="51,69 55,69 51,77 47,77" />
        </g>
      </g>

      {/* THE FRACTURE - Sharp jagged lightning line */}
      <path d="M 50 87 L 45 60 L 55 45 L 48 30 L 50 15" stroke={colors.neutral} strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
      
      {/* Floating sharp debris shards */}
      <polygon points="50,48 53,52 49,55" fill={colors.primary} stroke={colors.baseContent} strokeWidth="1.5" />
      <polygon points="56,38 59,40 55,44" fill={colors.primary} stroke={colors.baseContent} strokeWidth="1.5" />

      {/* 4-Point Star Sparkle floating above the break */}
      <path 
        d="M 50 5 Q 50 12 43 12 Q 50 12 50 19 Q 50 12 57 12 Q 50 12 50 5 Z" 
        fill={colors.accent} 
        stroke={colors.baseContent}
        strokeWidth="1.5"
      />
    </svg>
  );
}
