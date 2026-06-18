import React, { createContext, useContext, useState, ReactNode } from 'react';
import { themes, ThemeTokens } from './themes';

type ThemeContextType = {
  themeName: string;
  theme: ThemeTokens;
  setThemeName: (name: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: string;
}

export function ThemeProvider({ children, initialTheme = 'default' }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState(initialTheme);
  
  // Fallback to 'default' if an invalid theme string is provided
  const theme = themes[themeName] || themes['default'];

  return (
    <ThemeContext.Provider value={{ themeName, theme, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
