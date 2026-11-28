/** Device-only preferences; unavailable storage never blocks the game. */
export function readPreference(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writePreference(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* Session-only in private mode. */ }
}