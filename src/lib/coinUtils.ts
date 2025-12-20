/**
 * Coin utilities for handling the database storage format.
 * Coins are stored in the database as integers multiplied by 1000
 * to preserve fractional values (e.g., 0.86 coins = 860 in DB).
 */

/**
 * Convert raw database coin value to display value
 * @param rawAmount - The raw integer value from the database (e.g., 860)
 * @returns The actual coin value (e.g., 0.86)
 */
export const formatCoinsForDisplay = (rawAmount: number): string => {
  const actualValue = rawAmount / 1000;
  
  // If it's a whole number, show without decimals
  if (actualValue === Math.floor(actualValue)) {
    return actualValue.toLocaleString();
  }
  
  // Otherwise show up to 2 decimal places
  return actualValue.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
};

/**
 * Get the raw coin value for display (used for small amounts)
 * @param rawAmount - The raw integer value from the database
 * @returns The actual coin value as a number
 */
export const getDisplayCoinValue = (rawAmount: number): number => {
  return rawAmount / 1000;
};

/**
 * Format coin amount with + prefix for earned coins
 * @param rawAmount - The raw integer value from the database
 * @returns Formatted string like "+0.86 coins"
 */
export const formatEarnedCoins = (rawAmount: number): string => {
  const displayValue = formatCoinsForDisplay(rawAmount);
  return `+${displayValue} coins`;
};
