/**
 * Format duration in seconds to "M min" or "MM:SS" depending on context.
 */
export function formatDuration(seconds: number, format: 'short' | 'long' = 'short'): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);

  if (format === 'long') {
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  return `${m} min`;
}

/**
 * Format price in cents to display string. €4.99 not €4,99 (we use international notation).
 */
export function formatPrice(cents: number, currency: string = '€'): string {
  const euros = (cents / 100).toFixed(2);
  return `${currency}${euros}`;
}

/**
 * Format a Date as ISO 8601 date-only (yyyy-mm-dd).
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
