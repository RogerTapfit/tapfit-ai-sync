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
 * Get tomorrow's date in local timezone as YYYY-MM-DD string
 */
export const getLocalTomorrowString = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateString(tomorrow);
};

/**
 * Get a date N days ago in local timezone as YYYY-MM-DD string
 */
export const getLocalDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getLocalDateString(date);
};

/**
 * Get a date N months ago in local timezone as YYYY-MM-DD string
 */
export const getLocalDateMonthsAgo = (months: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return getLocalDateString(date);
};

/**
 * Convert a Date object to local date string for database queries
 * Ensures consistent date formatting across the app
 */
export const formatDateForDatabase = (date: Date): string => {
  return getLocalDateString(date);
};