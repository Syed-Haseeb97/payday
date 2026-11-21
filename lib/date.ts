/**
 * Date and timezone utilities for India (Asia/Kolkata).
 * Ensures consistency across server (e.g. UTC) and client (any user time zone).
 */

export const INDIA_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns a date formatted in YYYY-MM-DD in India Standard Time (Asia/Kolkata).
 * Defaults to current time.
 */
export function getIndiaTodayStr(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
