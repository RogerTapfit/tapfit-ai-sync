/**
 * Body measurement unit conversion utilities
 */

export type UnitSystem = 'imperial' | 'metric';

// Weight conversions
export const lbsToKg = (lbs: number): number => lbs * 0.453592;
export const kgToLbs = (kg: number): number => kg / 0.453592;

// Height conversions
export const feetInchesToCm = (feet: number, inches: number): number => 
  (feet * 12 + inches) * 2.54;

export const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

export const cmToInches = (cm: number): number => cm / 2.54;
export const inchesToCm = (inches: number): number => inches * 2.54;

// Display formatters
export const formatWeight = (kg: number, system: UnitSystem): string => {
  if (system === 'metric') {
    return `${kg.toFixed(1)} kg`;
  }
  return `${kgToLbs(kg).toFixed(1)} lbs`;
};

export const formatHeight = (cm: number, system: UnitSystem): string => {
  if (system === 'metric') {
    return `${cm.toFixed(0)} cm`;
  }
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}' ${inches}"`;
};

// Parse functions (from user input to kg/cm for storage)
export const parseWeight = (value: string, system: UnitSystem): number | null => {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  return system === 'metric' ? num : lbsToKg(num);
};

export const parseHeight = (
  value: string | { feet: string; inches: string }, 
  system: UnitSystem
): number | null => {
  if (system === 'metric') {
    const num = parseFloat(value as string);
    return isNaN(num) ? null : num;
  }
  
  // Imperial
  const { feet, inches } = value as { feet: string; inches: string };
  const feetNum = parseInt(feet, 10);
  const inchesNum = parseInt(inches, 10);
  
  if (isNaN(feetNum) || isNaN(inchesNum)) return null;
  return feetInchesToCm(feetNum, inchesNum);
};
