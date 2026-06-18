import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface MaskProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function Masquerade({ size = 120, className, opacity = 1 }: MaskProps) {
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
        Tilt the entire mask slightly for a dramatic, resting profile 
      */}
      <g transform="rotate(-8, 50, 50)">
        
        {/* RIBBONS (Drawn behind the mask) */}
        {/* Left Ribbon */}
        <path 
          d="M 15 48 Q 5 70 8 95" 
          fill="none" 
          stroke={colors.maskRibbon} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        {/* Right Ribbon */}
        <path 
          d="M 85 48 Q 95 70 90 95" 
          fill="none" 
          stroke={colors.maskRibbon} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />

        {/* FEATHERS (Attached to the top right of the mask) */}
        {/* Feather 1 (Long, arching left over the forehead) */}
        <g>
          <path 
            d="M 75 38 Q 60 -5 25 10 Q 55 20 75 38 Z" 
            fill={colors.maskFeather1} 
            opacity="0.9"
          />
          {/* Feather 1 Stem */}
          <path 
            d="M 75 38 Q 60 -5 25 10" 
            fill="none" 
            stroke={colors.maskAccent} 
            strokeWidth="1" 
            opacity="0.6"
          />
        </g>

        {/* Feather 2 (Shorter, arching right) */}
        <g>
          <path 
            d="M 78 40 Q 100 10 95 30 Q 88 35 78 40 Z" 
            fill={colors.maskFeather2} 
            opacity="0.9"
          />
          {/* Feather 2 Stem */}
          <path 
            d="M 78 40 Q 100 10 95 30" 
            fill="none" 
            stroke={colors.maskAccent} 
            strokeWidth="1" 
            opacity="0.6"
          />
        </g>

        {/* 
          MAIN MASK BASE & EYE HOLES 
          Using fillRule="evenodd" allows us to perfectly punch the eye holes 
          out of the mask, so whatever background is behind the SVG shows through!
        */}
        <path 
          fillRule="evenodd" 
          clipRule="evenodd"
          d="
            M 15 40 
            Q 50 20 85 40 
            Q 95 60 80 65 
            Q 65 70 50 55 
            Q 35 70 20 65 
            Q 5 60 15 40 
            Z
            
            M 25 45 Q 35 37 45 45 Q 35 53 25 45 Z
            M 55 45 Q 65 37 75 45 Q 65 53 55 45 Z
          "
          fill={colors.maskBase} 
          stroke={colors.maskAccent} 
          strokeWidth="2.5" 
          strokeLinejoin="round"
        />

        {/* DECORATIVE TRIM / FILIGREE ON THE MASK */}
        {/* Forehead Swirls */}
        <path d="M 50 28 Q 62 25 70 35" fill="none" stroke={colors.maskAccent} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 50 28 Q 38 25 30 35" fill="none" stroke={colors.maskAccent} strokeWidth="1.5" strokeLinecap="round" />
        
        {/* Cheek Drops */}
        <path d="M 35 55 Q 30 65 25 60" fill="none" stroke={colors.maskAccent} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 65 55 Q 70 65 75 60" fill="none" stroke={colors.maskAccent} strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
