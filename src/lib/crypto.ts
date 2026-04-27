/**
 * PIN hashing utilities using Web Crypto API (SHA-256).
 * The PIN is never stored in plaintext.
 */

const PIN_HASH_KEY = 'wt_pin_hash';
const PIN_SET_KEY = 'wt_pin_set';

/**
 * Hash a PIN string using SHA-256 and return hex digest.
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if a PIN has been set (first-time vs returning user).
 */
export function isPinSet(): boolean {
  return localStorage.getItem(PIN_SET_KEY) === 'true';
}

/**
 * Save a hashed PIN to localStorage.
 */
export async function savePin(pin: string): Promise<void> {
  const hashed = await hashPin(pin);
  localStorage.setItem(PIN_HASH_KEY, hashed);
  localStorage.setItem(PIN_SET_KEY, 'true');
}

/**
 * Verify a PIN against the stored hash.
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const storedHash = localStorage.getItem(PIN_HASH_KEY);
  if (!storedHash) return false;
  const inputHash = await hashPin(pin);
  return inputHash === storedHash;
}

/**
 * Wipe all app data (PIN, settings, tokens, IndexedDB).
 */
export function wipeAllAppData(): void {
  // Clear all localStorage
  localStorage.clear();
  // Delete IndexedDB
  indexedDB.deleteDatabase('worktrackify-finance');
  // Reload the page
  window.location.reload();
}
