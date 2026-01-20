import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GymTheme, getGymTheme, gymThemes } from '@/config/gymThemes';

interface GymThemeContextType {
  currentGym: string;
  currentTheme: GymTheme;
  setGym: (gymId: string) => void;
  availableGyms: GymTheme[];
  isDemo: boolean;
}

const GymThemeContext = createContext<GymThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'tapfit-gym-theme';

export const GymThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentGym, setCurrentGym] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'tapfit';
    } catch {
      return 'tapfit';
    }
  });

  const currentTheme = getGymTheme(currentGym);
  const availableGyms = Object.values(gymThemes);
  const isDemo = currentGym !== 'tapfit';

  // Apply theme CSS variables to document root
  const applyTheme = useCallback((theme: GymTheme) => {
    const root = document.documentElement;
    const { colors, gradients } = theme;

    // Set all color variables
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--primary-glow', colors.primaryGlow);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-foreground', colors.accentForeground);
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--card', colors.card);
    root.style.setProperty('--card-foreground', colors.cardForeground);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--muted-foreground', colors.mutedForeground);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--input', colors.input);
    root.style.setProperty('--ring', colors.ring);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--secondary-foreground', colors.secondaryForeground);

    // Set gradient variables
    root.style.setProperty('--gradient-primary', gradients.primary);
    root.style.setProperty('--glow-primary', gradients.glow);
    root.style.setProperty('--gradient-card', gradients.card);

    // Update body background
    document.body.style.background = gradients.background;
  }, []);

  // Apply theme on mount and when gym changes
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme, applyTheme]);

  const setGym = useCallback((gymId: string) => {
    setCurrentGym(gymId);
    try {
      localStorage.setItem(STORAGE_KEY, gymId);
    } catch {
      // Ignore storage errors
    }
  }, []);

  return (
    <GymThemeContext.Provider 
      value={{ 
        currentGym, 
        currentTheme, 
        setGym, 
        availableGyms,
        isDemo 
      }}
    >
      {children}
    </GymThemeContext.Provider>
  );
};

export const useGymTheme = (): GymThemeContextType => {
  const context = useContext(GymThemeContext);
  if (!context) {
    throw new Error('useGymTheme must be used within a GymThemeProvider');
  }
  return context;
};
