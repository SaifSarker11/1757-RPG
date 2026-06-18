import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface CharacterProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function WolfInSheepClothing({ size = 120, className, opacity = 1 }: CharacterProps) {
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
      {/* Sheep's Fleece (The Costume/Body) */}
      <path 
        d="M20,60 Q15,40 30,30 Q45,15 60,30 Q80,35 85,55 Q90,75 75,85 Q60,95 40,85 Q20,80 20,60 Z" 
        fill={colors.sheepFleece} 
        stroke={colors.characterOutline} 
        strokeWidth="2.5" 
      />

      {/* Fluffy sheep tail */}
      <circle cx="15" cy="65" r="8" fill={colors.sheepFleece} stroke={colors.characterOutline} strokeWidth="2" />

      {/* Dead/Fake Sheep's Head (Hanging backward like a hoodie) */}
      <circle 
        cx="40" 
        cy="25" 
        r="14" 
        fill={colors.sheepFace} 
        stroke={colors.characterOutline} 
        strokeWidth="2" 
      />
      {/* Fake sheep ear flopping down */}
      <path 
        d="M28,22 Q18,18 18,28 Q18,32 28,26 Z" 
        fill={colors.sheepFace} 
        stroke={colors.characterOutline} 
        strokeWidth="2" 
      />
      {/* Fake sheep closed/X eye (dead/costume) */}
      <path 
        d="M36,20 L40,24 M40,20 L36,24" 
        stroke={colors.characterOutline} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />

      {/* The Wolf (Peeking out of the front hole) */}
      <circle 
        cx="62" 
        cy="62" 
        r="20" 
        fill={colors.wolfFur} 
      />
      <circle 
        cx="62" 
        cy="62" 
        r="20" 
        fill="none"
        stroke={colors.characterOutline} 
        strokeWidth="2" 
        strokeDasharray="18 40" // Make the circle only partially outlined so it looks like it's inside the fleece
        strokeDashoffset="10"
      />

      {/* Wolf Snout extending outward */}
      <path 
        d="M62,60 L84,66 L78,76 L55,70 Z" 
        fill={colors.wolfFur} 
      />
      <path 
        d="M62,60 L84,66 L78,76 L55,70" 
        fill="none" 
        stroke={colors.characterOutline}
        strokeWidth="2"
      />

      {/* Wolf Nose */}
      <circle cx="82" cy="66" r="3.5" fill={colors.wolfNose} />

      {/* Wolf Ear protruding up out of the hole */}
      <path 
        d="M52,44 L45,28 L64,42 Z" 
        fill={colors.wolfFur} 
        stroke={colors.characterOutline} 
        strokeWidth="2" 
        strokeLinejoin="round"
      />

      {/* Wolf Glowing Angry Eye */}
      <path 
        d="M58,54 Q62,50 68,52" 
        stroke={colors.wolfEye} 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <circle cx="63" cy="54" r="2.5" fill={colors.wolfEye} />
      
      {/* Sharp Teeth showing from the snout */}
      <path 
        d="M70,70 L72.5,75 L75,70 L77.5,74 L80,68" 
        fill="none" 
        stroke="#FFFFFF" 
        strokeWidth="1.5" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
