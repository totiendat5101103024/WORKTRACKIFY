/**
 * Simple unique ID generator using crypto.randomUUID
 * with a fallback for older browsers.
 */

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
