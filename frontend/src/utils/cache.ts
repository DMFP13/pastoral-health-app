/**
 * Simple localStorage cache for API responses.
 *
 * Offline sync roadmap (not yet implemented):
 * 1. Wrap POST/PUT/DELETE in an IndexedDB outbox queue
 * 2. Register a service worker background sync event
 * 3. On reconnect, flush the outbox queue in order
 * 4. Use a last-write-wins or timestamp-based conflict resolution
 * 5. Animals and Events are good candidates for queue sync; triage is read-only
 */

const PREFIX = 'pastoral_cache_';

export function cacheSet(key: string, data: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Storage may be full or unavailable — fail silently
  }
}

export function cacheGet<T>(key: string, maxAgeMs = 86_400_000): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > maxAgeMs) return null;
    return data as T;
  } catch {
    return null;
  }
}

export function cacheClear(key?: string): void {
  try {
    if (key) {
      localStorage.removeItem(PREFIX + key);
    } else {
      Object.keys(localStorage)
        .filter(k => k.startsWith(PREFIX))
        .forEach(k => localStorage.removeItem(k));
    }
  } catch {
    // ignore
  }
}
