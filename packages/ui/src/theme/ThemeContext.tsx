"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getComputedThemeColors, AssetColors } from './themes';

type ThemeContextType = {
  /** The current DaisyUI theme name (e.g. "cyberpunk", "lemonade") */
  themeName: string;
  /** Resolved hex colors from DaisyUI CSS variables, safe for SVG fill/stroke */
  colors: AssetColors;
  /** Call this when the user changes the DaisyUI data-theme */
  syncTheme: (name: string) => void;
};

const defaultColors: AssetColors = {
  primary: '#6419E6',
  secondary: '#D926A9',
  accent: '#1FB2A6',
  neutral: '#2A323C',
  base100: '#FFFFFF',
  base200: '#F2F2F2',
  base300: '#E5E6E6',
  baseContent: '#1F2937',
  primaryContent: '#FFFFFF',
};

const ThemeContext = createContext<ThemeContextType>({
  themeName: 'lemonade',
  colors: defaultColors,
  syncTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: string;
}

export function ThemeProvider({ children, initialTheme = 'lemonade' }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState(initialTheme);
  const [colors, setColors] = useState<AssetColors>(defaultColors);

  // Re-read computed colors whenever the theme name changes
  useEffect(() => {
    // Small delay to let the browser apply the data-theme attribute
    const timer = setTimeout(() => {
      setColors(getComputedThemeColors());
    }, 50);
    return () => clearTimeout(timer);
  }, [themeName]);

  // Initial read on mount
  useEffect(() => {
    setColors(getComputedThemeColors());
  }, []);

  const syncTheme = (name: string) => {
    setThemeName(name);
  };

  return (
    <ThemeContext.Provider value={{ themeName, colors, syncTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Access the current DaisyUI theme's SVG-ready colors.
 * Use in any SVG component: `const { colors } = useTheme();`
 */
export function useTheme() {
  return useContext(ThemeContext);
}
