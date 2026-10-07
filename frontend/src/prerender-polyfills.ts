/**
 * Server-side (prerender) polyfills.
 *
 * The Angular services in this app were written for the browser and are
 * touched during static prerendering. Prerendering only needs the guest
 * (logged-out) rendering path, so simple in-memory shims are enough.
 */
import { createRequire } from 'node:module';

const nodeRequire = createRequire(import.meta.url);

const memory = new Map<string, string>();

const storageShim = {
  getItem: (key: string): string | null => (memory.has(key) ? (memory.get(key) as string) : null),
  setItem: (key: string, value: string): void => void memory.set(key, String(value)),
  removeItem: (key: string): void => void memory.delete(key),
  clear: (): void => void memory.clear(),
  key: (index: number): string | null => Array.from(memory.keys())[index] ?? null,
  get length(): number {
    return memory.size;
  },
};

const g = globalThis as Record<string, unknown>;

// Angular services read localStorage at construction time (AuthService, etc.)
if (typeof g['localStorage'] === 'undefined') {
  g['localStorage'] = storageShim;
}
if (typeof g['sessionStorage'] === 'undefined') {
  g['sessionStorage'] = storageShim;
}

// supabase-js constructs a RealtimeClient on createClient() and requires a
// WebSocket constructor. The app never uses realtime, but Node < 22 has no
// native WebSocket — provide the `ws` implementation to satisfy the check.
if (typeof g['WebSocket'] === 'undefined') {
  try {
    g['WebSocket'] = nodeRequire('ws');
  } catch {
    // ws not installed — realtime is unused, so ignore.
  }
}
