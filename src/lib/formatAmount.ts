/**
 * Banking-style number formatting utilities.
 * Formats numbers with thousand separators as user types.
 */

/** Format raw digits into comma-separated display string. */
export function formatAmountDisplay(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

/** Parse formatted display string back to a plain number. */
export function parseAmountDisplay(formatted: string): number {
  return Number(formatted.replace(/,/g, '')) || 0;
}
