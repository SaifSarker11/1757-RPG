"use client";

import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface CharacterProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function WolfInSheepClothing({ size = 120, className, opacity = 1 }: CharacterProps) {
  const { colors } = useTheme();

  return (
    <svg 
      width={size} height={size} 
      viewBox="0 0 100 100" fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className} opacity={opacity}
    >
      {/* Background Y2K Tech Crosshairs / Orbit ring */}
      <circle cx="50" cy="50" r="45" stroke={colors.accent} strokeWidth="1" strokeDasharray="4 8" />
      <path d="M 50 2 L 50 12 M 50 88 L 50 98 M 2 50 L 12 50 M 88 50 L 98 50" stroke={colors.accent} strokeWidth="1.5" />

      {/* Sheep's Fleece (The Costume/Body) - Sharp polygonal cloud edges */}
      <path 
        d="M25,55 L15,45 L25,30 L45,20 L60,25 L80,30 L88,50 L82,70 L65,85 L45,85 L25,75 Z" 
        fill={colors.base200} stroke={colors.baseContent} strokeWidth="3" 
      />

      {/* Fluffy sheep tail - sharp diamond shape */}
      <polygon points="15,65 5,60 10,75 20,70" fill={colors.base200} stroke={colors.baseContent} strokeWidth="2.5" />

      {/* Dead/Fake Sheep's Head - Sharp hexagonal shape */}
      <polygon points="35,15 48,15 52,28 44,38 30,35 28,25" fill={colors.base300} stroke={colors.baseContent} strokeWidth="2.5" />
      {/* Fake sheep closed/X eye (dead/costume) */}
      <path d="M34,22 L40,28 M40,22 L34,28" stroke={colors.baseContent} strokeWidth="2" strokeLinecap="square" />

      {/* The Wolf (Peeking out of sharp polygonal opening) */}
      {/* Wolf Face Profile (Angular / Cyberpunk style) */}
      <polygon 
        points="52,48 72,44 88,58 84,68 76,68 64,72 50,60" 
        fill={colors.neutral} 
        stroke={colors.baseContent} 
        strokeWidth="3" 
        strokeLinejoin="miter"
      />

      {/* Wolf Nose - Sharp polygon */}
      <polygon points="85,58 88,58 86,62" fill={colors.baseContent} />

      {/* Wolf Cybernetic Ear - Sharp arrow-like triangle */}
      <polygon points="46,45 35,28 52,38" fill={colors.neutral} stroke={colors.baseContent} strokeWidth="2.5" strokeLinejoin="miter" />
      <polygon points="44,42 38,32 48,38" fill={colors.accent} />

      {/* Wolf Glowing Angry Eye - Sharp horizontal slot / visor style */}
      <polygon points="56,52 68,48 70,52 58,56" fill={colors.secondary} stroke={colors.baseContent} strokeWidth="1" />
      
      {/* Sharp Teeth - Sharp zigzag triangles */}
      <path d="M68,66 L72,71 L74,66 L78,70 L80,65" fill={colors.base100} stroke={colors.baseContent} strokeWidth="1.5" strokeLinejoin="miter" />

      {/* Y2K Starburst Sparkle (top right) */}
      <path 
        d="M 82 12 Q 82 22 72 22 Q 82 22 82 32 Q 82 22 92 22 Q 82 22 82 12 Z" 
        fill={colors.accent} 
        stroke={colors.baseContent}
        strokeWidth="1.5"
      />
    </svg>
  );
}
