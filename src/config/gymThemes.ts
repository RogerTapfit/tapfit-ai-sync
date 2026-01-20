// Gym White-Label Theming System
// Each gym has its own brand colors that override TapFit's default theme

import tapfitLogo from '@/assets/tapfit-hero-new.jpg';
import twentyFourHourLogo from '@/assets/gyms/24-hour-fitness.png';
import planetFitnessLogo from '@/assets/gyms/planet-fitness.png';
import laFitnessLogo from '@/assets/gyms/la-fitness.png';
import bayClubLogo from '@/assets/gyms/bay-club.png';
import goldsGymLogo from '@/assets/gyms/golds-gym.png';
import equinoxLogo from '@/assets/gyms/equinox.png';

// Background images for each gym theme
import tapfitBg from '@/assets/tapfit-hero-new.jpg';
import twentyFourHourBg from '@/assets/gyms/backgrounds/24-hour-fitness-bg.jpg';
import planetFitnessBg from '@/assets/gyms/backgrounds/planet-fitness-bg.jpg';
import laFitnessBg from '@/assets/gyms/backgrounds/la-fitness-bg.jpg';
import bayClubBg from '@/assets/gyms/backgrounds/bay-club-bg.jpg';
import equinoxBg from '@/assets/gyms/backgrounds/equinox-bg.jpg';
import goldsGymBg from '@/assets/gyms/backgrounds/golds-gym-bg.jpg';

export interface GymTheme {
  id: string;
  displayName: string;
  logoUrl: string;
  heroBackground: string;
  logoScale?: number; // Optional multiplier for logo display size (default 1)
  colors: {
    // Primary brand color (main buttons, accents)
    primary: string; // HSL values e.g. "0 84% 60%"
    primaryForeground: string;
    primaryGlow: string;
    
    // Accent color for secondary highlights
    accent: string;
    accentForeground: string;
    
    // Background colors
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    
    // Muted colors
    muted: string;
    mutedForeground: string;
    
    // Border and input
    border: string;
    input: string;
    ring: string;
    
    // Secondary
    secondary: string;
    secondaryForeground: string;
  };
  gradients: {
    primary: string;
    glow: string;
    card: string;
    background: string;
  };
}

export const gymThemes: Record<string, GymTheme> = {
  tapfit: {
    id: 'tapfit',
    displayName: 'TapFit',
    logoUrl: tapfitLogo,
    heroBackground: tapfitBg,
    colors: {
      primary: '0 84% 60%',
      primaryForeground: '0 0% 98%',
      primaryGlow: '0 100% 70%',
      accent: '0 0% 14%',
      accentForeground: '0 84% 60%',
      background: '0 0% 6%',
      foreground: '0 0% 95%',
      card: '0 0% 8%',
      cardForeground: '0 0% 95%',
      muted: '0 0% 10%',
      mutedForeground: '0 0% 65%',
      border: '0 0% 15%',
      input: '0 0% 12%',
      ring: '0 84% 60%',
      secondary: '0 0% 12%',
      secondaryForeground: '0 0% 90%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(0 84% 60%), hsl(15 90% 65%))',
      glow: '0 0 20px hsl(0 84% 60% / 0.3)',
      card: 'linear-gradient(135deg, hsl(0 0% 8%) 0%, hsl(0 0% 12%) 100%)',
      background: 'radial-gradient(ellipse at top, hsl(0 0% 8%) 0%, hsl(0 0% 6%) 100%)',
    },
  },

  '24hour': {
    id: '24hour',
    displayName: '24 Hour Fitness',
    logoUrl: twentyFourHourLogo,
    heroBackground: twentyFourHourBg,
    colors: {
      primary: '216 100% 45%', // Blue
      primaryForeground: '0 0% 98%',
      primaryGlow: '216 100% 55%',
      accent: '0 85% 55%', // Red accent
      accentForeground: '0 0% 98%',
      background: '220 20% 6%',
      foreground: '0 0% 95%',
      card: '220 20% 10%',
      cardForeground: '0 0% 95%',
      muted: '220 15% 12%',
      mutedForeground: '220 10% 65%',
      border: '220 15% 18%',
      input: '220 15% 14%',
      ring: '216 100% 45%',
      secondary: '220 15% 14%',
      secondaryForeground: '0 0% 90%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(216 100% 45%), hsl(216 90% 55%))',
      glow: '0 0 20px hsl(216 100% 45% / 0.3)',
      card: 'linear-gradient(135deg, hsl(220 20% 10%) 0%, hsl(220 20% 14%) 100%)',
      background: 'radial-gradient(ellipse at top, hsl(220 20% 10%) 0%, hsl(220 20% 6%) 100%)',
    },
  },

  planet: {
    id: 'planet',
    displayName: 'Planet Fitness',
    logoUrl: planetFitnessLogo,
    heroBackground: planetFitnessBg,
    colors: {
      primary: '280 100% 40%', // Purple
      primaryForeground: '0 0% 98%',
      primaryGlow: '280 100% 50%',
      accent: '55 100% 50%', // Yellow accent
      accentForeground: '0 0% 10%',
      background: '280 30% 6%',
      foreground: '0 0% 95%',
      card: '280 25% 10%',
      cardForeground: '0 0% 95%',
      muted: '280 20% 12%',
      mutedForeground: '280 10% 65%',
      border: '280 20% 18%',
      input: '280 20% 14%',
      ring: '280 100% 40%',
      secondary: '280 20% 14%',
      secondaryForeground: '0 0% 90%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(280 100% 40%), hsl(300 90% 50%))',
      glow: '0 0 20px hsl(280 100% 40% / 0.4)',
      card: 'linear-gradient(135deg, hsl(280 25% 10%) 0%, hsl(280 25% 14%) 100%)',
      background: 'radial-gradient(ellipse at top, hsl(280 30% 10%) 0%, hsl(280 30% 6%) 100%)',
    },
  },

  lafitness: {
    id: 'lafitness',
    displayName: 'LA Fitness',
    logoUrl: laFitnessLogo,
    heroBackground: laFitnessBg,
    logoScale: 3, // LA Fitness logo displayed at 3x for better visibility
    colors: {
      primary: '25 100% 50%', // Orange
      primaryForeground: '0 0% 98%',
      primaryGlow: '25 100% 60%',
      accent: '210 70% 45%', // Blue accent
      accentForeground: '0 0% 98%',
      background: '25 10% 6%',
      foreground: '0 0% 95%',
      card: '25 10% 10%',
      cardForeground: '0 0% 95%',
      muted: '25 8% 12%',
      mutedForeground: '25 5% 65%',
      border: '25 10% 18%',
      input: '25 10% 14%',
      ring: '25 100% 50%',
      secondary: '25 10% 14%',
      secondaryForeground: '0 0% 90%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(25 100% 50%), hsl(35 100% 55%))',
      glow: '0 0 20px hsl(25 100% 50% / 0.3)',
      card: 'linear-gradient(135deg, hsl(25 10% 10%) 0%, hsl(25 10% 14%) 100%)',
      background: 'radial-gradient(ellipse at top, hsl(25 10% 10%) 0%, hsl(25 10% 6%) 100%)',
    },
  },

  bayclub: {
    id: 'bayclub',
    displayName: 'Bay Club',
    logoUrl: bayClubLogo,
    heroBackground: bayClubBg,
    colors: {
      primary: '220 60% 30%', // Navy blue
      primaryForeground: '0 0% 98%',
      primaryGlow: '220 60% 40%',
      accent: '40 30% 85%', // Cream accent
      accentForeground: '220 60% 20%',
      background: '220 40% 6%',
      foreground: '0 0% 95%',
      card: '220 35% 10%',
      cardForeground: '0 0% 95%',
      muted: '220 30% 12%',
      mutedForeground: '220 20% 65%',
      border: '220 25% 18%',
      input: '220 30% 14%',
      ring: '220 60% 30%',
      secondary: '220 30% 14%',
      secondaryForeground: '0 0% 90%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(220 60% 30%), hsl(220 50% 40%))',
      glow: '0 0 20px hsl(220 60% 30% / 0.3)',
      card: 'linear-gradient(135deg, hsl(220 35% 10%) 0%, hsl(220 35% 14%) 100%)',
      background: 'radial-gradient(ellipse at top, hsl(220 40% 10%) 0%, hsl(220 40% 6%) 100%)',
    },
  },

  equinox: {
    id: 'equinox',
    displayName: 'Equinox',
    logoUrl: equinoxLogo,
    heroBackground: equinoxBg,
    colors: {
      primary: '0 0% 15%', // Near black
      primaryForeground: '45 80% 55%', // Gold text
      primaryGlow: '45 80% 55%',
      accent: '45 80% 55%', // Gold accent
      accentForeground: '0 0% 5%',
      background: '0 0% 3%',
      foreground: '0 0% 95%',
      card: '0 0% 6%',
      cardForeground: '0 0% 95%',
      muted: '0 0% 8%',
      mutedForeground: '0 0% 60%',
      border: '0 0% 12%',
      input: '0 0% 10%',
      ring: '45 80% 55%',
      secondary: '0 0% 10%',
      secondaryForeground: '45 80% 55%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(0 0% 15%), hsl(0 0% 25%))',
      glow: '0 0 20px hsl(45 80% 55% / 0.2)',
      card: 'linear-gradient(135deg, hsl(0 0% 6%) 0%, hsl(0 0% 10%) 100%)',
      background: 'radial-gradient(ellipse at top, hsl(0 0% 6%) 0%, hsl(0 0% 3%) 100%)',
    },
  },

  golds: {
    id: 'golds',
    displayName: "Gold's Gym",
    logoUrl: goldsGymLogo,
    heroBackground: goldsGymBg,
    colors: {
      primary: '45 90% 50%', // Gold
      primaryForeground: '0 0% 10%',
      primaryGlow: '45 100% 60%',
      accent: '0 80% 50%', // Red accent
      accentForeground: '0 0% 98%',
      background: '30 20% 6%',
      foreground: '0 0% 95%',
      card: '30 15% 10%',
      cardForeground: '0 0% 95%',
      muted: '30 12% 12%',
      mutedForeground: '30 8% 65%',
      border: '30 15% 18%',
      input: '30 12% 14%',
      ring: '45 90% 50%',
      secondary: '30 12% 14%',
      secondaryForeground: '0 0% 90%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(45 90% 50%), hsl(40 100% 55%))',
      glow: '0 0 20px hsl(45 90% 50% / 0.4)',
      card: 'linear-gradient(135deg, hsl(30 15% 10%) 0%, hsl(30 15% 14%) 100%)',
      background: 'radial-gradient(ellipse at top, hsl(30 20% 10%) 0%, hsl(30 20% 6%) 100%)',
    },
  },
};

export const getGymTheme = (gymId: string): GymTheme => {
  return gymThemes[gymId] || gymThemes.tapfit;
};

export const getAvailableGyms = (): GymTheme[] => {
  return Object.values(gymThemes);
};
