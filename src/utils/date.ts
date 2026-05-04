/**
 * Date and Time Utilities
 *
 * This module provides utilities for handling dates and times,
 * particularly for converting to IST (Indian Standard Time) format
 * that matches the API's timestamp format.
 */

/** IST offset in milliseconds (UTC+5:30 = 5.5 hours) */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Formats a Date object as an ISO string where UTC hours/minutes represent IST time.
 * This matches the API's timestamp format where UTC hours/minutes in the ISO string
 * represent IST time values (not actual UTC time).
 * 
 * @param istDate - Date object representing IST time
 * @returns ISO 8601 timestamp string with IST time values in UTC format
 */
function formatISTAsISO(istDate: Date): string {
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(istDate.getUTCMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

/**
 * Converts UTC time in milliseconds to IST time and formats it as an ISO string.
 * 
 * @param utcTimeMs - UTC time in milliseconds
 * @returns ISO 8601 timestamp string with IST time values in UTC format
 */
function convertUTCMsToISTFormat(utcTimeMs: number): string {
  const istTime = new Date(utcTimeMs + IST_OFFSET_MS);
  return formatISTAsISO(istTime);
}

/**
 * Gets the current time in IST (Indian Standard Time) and formats it as an ISO string.
 * The API stores timestamps where the UTC hours/minutes in the ISO string
 * represent IST time values (not actual UTC time).
 * 
 * For example, if it's 18:05 IST, this function returns an ISO string like
 * "2026-01-25T18:05:00.000Z" where 18:05 represents IST time, not UTC.
 * 
 * @returns ISO 8601 timestamp string with IST time values in UTC format
 */
export function getCurrentISTTimestamp(): string {
  const utcTime = new Date().getTime();
  return convertUTCMsToISTFormat(utcTime);
}

/**
 * Converts a UTC timestamp (from API response) to IST format that matches the API's timestamp format.
 * The API stores timestamps where the UTC hours/minutes in the ISO string represent IST time values.
 * 
 * This function is used when receiving timestamps from API responses (e.g., after sending a message)
 * that are in actual UTC format, and converts them to the format where UTC hours/minutes represent IST.
 * 
 * @param utcTimestamp - ISO 8601 timestamp string in actual UTC format (e.g., "2026-01-25T12:35:00.000Z")
 * @returns ISO 8601 timestamp string with IST time values in UTC format (e.g., "2026-01-25T18:05:00.000Z")
 */
export function convertUTCToISTFormat(utcTimestamp: string): string {
  if (!utcTimestamp) return utcTimestamp;
  
  const utcDate = new Date(utcTimestamp);
  if (isNaN(utcDate.getTime())) return utcTimestamp;
  
  return convertUTCMsToISTFormat(utcDate.getTime());
}

/**
 * Gets the IST date from an ISO timestamp string.
 * The API timestamps have UTC hours/minutes that represent IST time values.
 * We extract the date components directly from the ISO string to avoid timezone conversion issues.
 * 
 * @param isoTimestamp - ISO 8601 timestamp string (e.g., "2026-01-25T18:05:00.000Z")
 * @returns Date object representing the IST date (date components extracted from ISO string)
 */
function getISTDateFromISO(isoTimestamp: string): Date {
  if (!isoTimestamp) return new Date();
  
  // Extract date components directly from ISO string (YYYY-MM-DD)
  // The date part in the ISO string represents the actual date in IST
  const dateMatch = isoTimestamp.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) return new Date();
  
  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10) - 1; // Month is 0-indexed
  const day = parseInt(dateMatch[3], 10);
  
  // Create a date object using UTC methods (for consistent date-only comparison)
  return new Date(Date.UTC(year, month, day));
}

/**
 * Formats a date for display in date separators.
 * Returns "Today", "Yesterday", or a formatted date string (e.g., "Jan 24, 2026").
 * All dates are compared in IST timezone.
 * 
 * @param isoTimestamp - ISO 8601 timestamp string (e.g., "2026-01-25T18:05:00.000Z")
 * @returns Formatted date string: "Today", "Yesterday", or "MMM DD, YYYY"
 */
export function formatDateForSeparator(isoTimestamp: string): string {
  if (!isoTimestamp) return '';
  
  const messageDate = getISTDateFromISO(isoTimestamp);
  if (isNaN(messageDate.getTime())) return '';
  
  // Get current date in IST
  const now = new Date();
  const currentIST = new Date(now.getTime() + IST_OFFSET_MS);
  const todayIST = new Date(Date.UTC(
    currentIST.getUTCFullYear(),
    currentIST.getUTCMonth(),
    currentIST.getUTCDate()
  ));
  
  // Get yesterday in IST
  const yesterdayIST = new Date(todayIST);
  yesterdayIST.setUTCDate(yesterdayIST.getUTCDate() - 1);
  
  // Compare dates (year, month, day only)
  const messageDateOnly = new Date(Date.UTC(
    messageDate.getUTCFullYear(),
    messageDate.getUTCMonth(),
    messageDate.getUTCDate()
  ));
  
  if (messageDateOnly.getTime() === todayIST.getTime()) {
    return 'Today';
  }
  
  if (messageDateOnly.getTime() === yesterdayIST.getTime()) {
    return 'Yesterday';
  }
  
  // Format as "MMM DD, YYYY" (e.g., "Jan 24, 2026")
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[messageDate.getUTCMonth()];
  const day = messageDate.getUTCDate();
  const year = messageDate.getUTCFullYear();
  
  return `${month} ${day}, ${year}`;
}

/**
 * Gets the date key (YYYY-MM-DD) from an ISO timestamp for comparison purposes.
 * Uses IST timezone for date extraction by parsing the date directly from the ISO string.
 * 
 * @param isoTimestamp - ISO 8601 timestamp string (e.g., "2026-01-25T18:05:00.000Z")
 * @returns Date key string in format "YYYY-MM-DD" (IST timezone)
 */
export function getDateKey(isoTimestamp: string): string {
  if (!isoTimestamp) return '';
  
  // Extract date components directly from ISO string (YYYY-MM-DD)
  const dateMatch = isoTimestamp.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dateMatch) return '';
  
  // Return the date part directly from the ISO string
  return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
}
