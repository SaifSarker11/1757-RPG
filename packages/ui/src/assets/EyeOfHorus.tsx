import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface EyeProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function EyeOfHorus({ size = 120, className, opacity = 1 }: EyeProps) {
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
        {/* Glow filter for the aura of Providence */}
        <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* The All-Seeing Triangle / Pyramid (Providence background) */}
      <path 
        d="M50,10 L90,85 L10,85 Z" 
        stroke={colors.eyeGlow} 
        strokeWidth="2.5" 
        fill={colors.eyeGlow}
        fillOpacity="0.15"
        filter="url(#eyeGlow)"
        strokeLinejoin="round"
      />
      {/* Triangle Inner geometric outline */}
      <path 
        d="M50,18 L83,80 L17,80 Z" 
        stroke={colors.eyeMarkings} 
        strokeWidth="1.5" 
        opacity="0.6"
        strokeLinejoin="round"
      />

      {/* The Sclera (White of the Eye) */}
      <path 
        d="M20,50 Q50,30 80,50 Q50,70 20,50 Z" 
        fill={colors.eyeSclera} 
        stroke={colors.eyeMarkings}
        strokeWidth="2.5"
      />

      {/* The Iris */}
      <circle cx="50" cy="50" r="12" fill={colors.eyeIris} />

      {/* The Pupil */}
      <circle cx="50" cy="50" r="5" fill={colors.eyePupil} />

      {/* The Eye Highlight/Reflection */}
      <circle cx="47" cy="46" r="2.5" fill="#FFFFFF" opacity="0.8" />

      {/* Eye of Horus Signature Markings */}
      
      {/* Thick top eyeliner extending out the right side */}
      <path 
        d="M15,50 Q50,26 85,50 L95,50" 
        stroke={colors.eyeMarkings} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none"
      />
      
      {/* The Divine Brow floating above the eye */}
      <path 
        d="M18,35 Q50,15 82,35" 
        stroke={colors.eyeMarkings} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none"
      />

      {/* The Teardrop Line (straight down from left of center) */}
      <path 
        d="M42,65 L42,85" 
        stroke={colors.eyeMarkings} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />

      {/* The Falcon Curl/Tail (curves down and right from center) */}
      <path 
        d="M55,67 Q65,95 80,85" 
        stroke={colors.eyeMarkings} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        fill="none"
      />
      {/* Falcon Curl decorative end tip */}
      <circle cx="80" cy="85" r="2.5" fill={colors.eyeMarkings} />
      
      {/* Magical rays extending outward */}
      <path d="M50,2 M50,5" stroke={colors.eyeGlow} strokeWidth="2" strokeLinecap="round"/>
      <path d="M5,50 M1,50" stroke={colors.eyeGlow} strokeWidth="2" strokeLinecap="round"/>
      <path d="M95,50 M99,50" stroke={colors.eyeGlow} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
