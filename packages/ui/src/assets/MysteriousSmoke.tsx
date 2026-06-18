"use client";

import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export interface SmokeProps {
  size?: number;
  className?: string;
  opacity?: number;
}

export function MysteriousSmoke({ size = 150, className, opacity = 1 }: SmokeProps) {
  const { colors } = useTheme();

  return (
    <svg 
      width={size} height={size} 
      viewBox="0 0 100 100" fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className} opacity={opacity}
    >
      {/* Background Y2K Tech Radar Rings (Techno-mystical) */}
      <circle cx="50" cy="50" r="45" stroke={colors.accent} strokeWidth="1" strokeDasharray="2 4" />
      <circle cx="50" cy="50" r="35" stroke={colors.accent} strokeWidth="1.5" strokeDasharray="8 8" />

      {/* Y2K Orbit Ring (Drifting angled ring) */}
      <ellipse cx="50" cy="50" rx="42" ry="15" stroke={colors.accent} strokeWidth="2" transform="rotate(-30 50 50)">
        <animateTransform 
          attributeName="transform" 
          type="rotate" 
          values="-30 50 50; -20 50 50; -30 50 50" 
          dur="6s" 
          repeatCount="indefinite" 
        />
      </ellipse>

      {/* Base Shadow Ring - Sharp Ellipse */}
      <ellipse cx="50" cy="85" rx="35" ry="8" fill={colors.neutral} stroke={colors.baseContent} strokeWidth="2.5" />

      {/* 
        SHARP VECTOR SMOKE CLOUDS 
        Concentric blocky octagonal clouds that expand and contract.
      */}
      {/* Outer Layer */}
      <g>
        <animateTransform 
          attributeName="transform" 
          type="scale" 
          values="1; 1.05; 1" 
          keyTimes="0; 0.5; 1"
          dur="5s" 
          transform-origin="50 50"
          repeatCount="indefinite" 
        />
        <polygon 
          points="50,15 70,25 85,45 80,65 65,80 35,80 20,65 15,45 30,25" 
          fill={colors.secondary} 
          stroke={colors.baseContent} 
          strokeWidth="3.5"
          opacity="0.3"
        />
      </g>

      {/* Middle Layer */}
      <g>
        <animateTransform 
          attributeName="transform" 
          type="scale" 
          values="1; 0.95; 1" 
          keyTimes="0; 0.5; 1"
          dur="4s" 
          transform-origin="50 50"
          repeatCount="indefinite" 
        />
        <polygon 
          points="50,22 66,30 78,46 74,62 62,74 38,74 26,62 22,46 34,30" 
          fill={colors.neutral} 
          stroke={colors.baseContent} 
          strokeWidth="3"
          opacity="0.7"
        />
      </g>

      {/* Inner Core */}
      <g>
        <animateTransform 
          attributeName="transform" 
          type="scale" 
          values="0.95; 1.03; 0.95" 
          keyTimes="0; 0.5; 1"
          dur="3s" 
          transform-origin="50 50"
          repeatCount="indefinite" 
        />
        <polygon 
          points="50,30 62,36 70,48 67,60 58,70 42,70 30,60 33,36" 
          fill={colors.primary} 
          stroke={colors.baseContent} 
          strokeWidth="2.5"
        />
      </g>

      {/* 
        SHARP TECH TENDRILS / VECTOR RAYS 
        Using zigzag lightning/arrows instead of smooth lines.
      */}
      {/* Left Sharp Tendril */}
      <path 
        d="M 35 70 L 25 50 L 35 35 L 28 20 M 28 20 L 24 25 M 28 20 L 33 22" 
        stroke={colors.accent} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"
      >
        <animate attributeName="stroke-dasharray" values="100; 0; 100" dur="4s" repeatCount="indefinite" />
      </path>

      {/* Right Sharp Tendril */}
      <path 
        d="M 65 70 L 75 52 L 65 38 L 72 20 M 72 20 L 68 25 M 72 20 L 77 22" 
        stroke={colors.accent} strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" fill="none"
      >
        <animate attributeName="stroke-dasharray" values="0; 100; 0" dur="5s" repeatCount="indefinite" />
      </path>

      {/* Center Y2K 4-Point Starburst Sparkles */}
      <path 
        d="M 50 35 Q 50 45 40 45 Q 50 45 50 55 Q 50 45 60 45 Q 50 45 50 35 Z" 
        fill={colors.base100} 
        stroke={colors.baseContent} 
        strokeWidth="1.5"
      />
      <path 
        d="M 72 65 Q 72 70 67 70 Q 72 70 72 75 Q 72 70 77 70 Q 72 70 72 65 Z" 
        fill={colors.base100} 
        stroke={colors.baseContent} 
        strokeWidth="1"
      />
    </svg>
  );
}
