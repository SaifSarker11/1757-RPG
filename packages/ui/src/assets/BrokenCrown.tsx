import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface CrownProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function BrokenCrown({ size = 120, className, opacity = 1 }: CrownProps) {
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
        {/* Adds a slight drop shadow to the broken right piece so it feels detached and hovering/falling */}
        <filter id="fallingShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="5" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* 
        LEFT HALF (Intact base) 
        The crown is mathematically split perfectly down the middle with a jagged fracture.
      */}
      <g stroke={colors.crownShadow} strokeWidth="2.5" strokeLinejoin="round">
        
        {/* Main Body Left */}
        <path 
          d="M 15 80 Q 32.5 85 50 87 L 45 60 L 55 45 L 48 30 L 50 15 L 30 50 L 10 30 Z" 
          fill={colors.crownBase} 
        />
        
        {/* Left Bottom Band/Rim for 3D depth */}
        <path 
          d="M 15 80 Q 32.5 85 50 87 L 47 75 Q 32.5 73 17 68 Z" 
          fill={colors.crownHighlight} 
          opacity="0.6"
        />

        {/* Left Jewel */}
        <circle cx="28" cy="65" r="4" fill={colors.crownJewel} />
        {/* Left Jewel Highlight */}
        <circle cx="26.5" cy="63.5" r="1.5" fill="#FFFFFF" opacity="0.8" stroke="none" />
      </g>

      {/* 
        RIGHT HALF (Broken off) 
        We use a transform to physically shift and rotate this half off the crown!
      */}
      <g 
        transform="translate(6, 4) rotate(14, 70, 70)" 
        stroke={colors.crownShadow} 
        strokeWidth="2.5" 
        strokeLinejoin="round"
        filter="url(#fallingShadow)"
      >
        
        {/* Main Body Right */}
        <path 
          d="M 50 87 Q 67.5 85 85 80 L 90 30 L 70 50 L 50 15 L 48 30 L 55 45 L 45 60 Z" 
          fill={colors.crownBase} 
        />
        
        {/* Right Bottom Band/Rim */}
        <path 
          d="M 50 87 Q 67.5 85 85 80 L 83 68 Q 67.5 73 47 75 Z" 
          fill={colors.crownHighlight} 
          opacity="0.6"
        />

        {/* Right Jewel */}
        <circle cx="72" cy="65" r="4" fill={colors.crownJewel} />
        {/* Right Jewel Highlight */}
        <circle cx="70.5" cy="63.5" r="1.5" fill="#FFFFFF" opacity="0.8" stroke="none" />
        
        {/* Center Jewel (attached to the broken right half so it falls with it) */}
        <circle cx="53" cy="72" r="5" fill={colors.crownJewel} />
        {/* Center Jewel Highlight */}
        <circle cx="51.5" cy="70.5" r="2" fill="#FFFFFF" opacity="0.8" stroke="none" />
      </g>

      {/* 
        THE FRACTURE ENERGY 
        In Cyberpunk or magical themes, the crack itself can glow or have energy.
      */}
      <path 
        d="M 50 87 L 45 60 L 55 45 L 48 30 L 50 15" 
        stroke={colors.crownFracture} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
        opacity="0.8"
      />
      <path 
        d="M 56 91 L 51 64 L 61 49 L 54 34 L 56 19" // Translated offset for the gap
        stroke={colors.crownFracture} 
        strokeWidth="1" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />
      
      {/* Floating debris/shards falling from the crack */}
      <polygon points="50,48 53,52 49,55" fill={colors.crownBase} stroke={colors.crownShadow} strokeWidth="1" />
      <polygon points="56,38 59,40 55,44" fill={colors.crownBase} stroke={colors.crownShadow} strokeWidth="1" />

    </svg>
  );
}
