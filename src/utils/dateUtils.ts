/**
 * Date utility functions for consistent local date handling
 * Prevents timezone-related date shifts around midnight
 */

/**
 * Get local date in YYYY-MM-DD format (no timezone conversion)
 * This ensures dates stay consistent in user's local timezone
 * and don't shift around midnight due to UTC conversion
 */
export const getLocalDateString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current local date string for logging food entries
 * Always uses user's local timezone for consistent day boundaries
 */
export const getCurrentLocalDate = (): string => {
  return getLocalDateString(new Date());
};

/**
 * Convert a Date object to local date string for database queries
 * Ensures consistent date formatting across the app
 */
export const formatDateForDatabase = (date: Date): string => {
  return getLocalDateString(date);
};