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
  // Display as whole numbers with thousand separators (like Bitcoin)
  return Math.floor(rawAmount).toLocaleString();
};

/**
 * Get the raw coin value for display
 * @param rawAmount - The raw integer value from the database
 * @returns The coin value as a whole number
 */
export const getDisplayCoinValue = (rawAmount: number): number => {
  return Math.floor(rawAmount);
};

/**
 * Format coin amount with + prefix for earned coins
 * @param rawAmount - The raw integer value from the database
 * @returns Formatted string like "+0.86 coins"
 */
export const formatEarnedCoins = (rawAmount: number): string => {
  return `+${Math.floor(rawAmount).toLocaleString()} coins`;
};
