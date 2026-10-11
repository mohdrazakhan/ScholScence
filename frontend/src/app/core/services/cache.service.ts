import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface CacheOptions {
  /** Time to live in milliseconds (default: 5 minutes = 300,000ms) */
  ttlMs?: number;
  /** Persist to browser localStorage across page reloads (default: false) */
  persist?: boolean;
  /** School-specific namespace key to isolate multi-tenant data */
  schoolId?: string;
}

export interface CacheDriver {
  get<T>(key: string): Promise<T | null> | T | null;
  set<T>(key: string, value: T, ttlMs: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  deletePattern(pattern: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

/**
 * In-memory fast cache driver (L1 Cache)
 */
class MemoryCacheDriver implements CacheDriver {
  private store = new Map<string, { value: any; expiry: number }>();

  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deletePattern(pattern: string): void {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * LocalStorage persistent cache driver (L2 Cache)
 */
class LocalStorageCacheDriver implements CacheDriver {
  private prefix = 'schoolsense_cache_';

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(this.prefix + key);
        return null;
      }
      return parsed.value as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    try {
      localStorage.setItem(
        this.prefix + key,
        JSON.stringify({
          value,
          expiry: Date.now() + ttlMs,
        })
      );
    } catch (e) {
      console.warn('LocalStorageCacheDriver quota exceeded or write failed:', e);
    }
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {}
  }

  deletePattern(pattern: string): void {
    try {
      const regex = new RegExp('^' + this.prefix + pattern.replace(/\*/g, '.*') + '$');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && regex.test(k)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }

  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
  }
}

/**
 * Future Remote Redis Driver (L3 Cache)
 * Compatible with Upstash REST or Redis HTTP Gateway API.
 * Activated whenever `environment.redisCache.enabled` is set to true.
 */
class RemoteRedisCacheDriver implements CacheDriver {
  constructor(
    private endpoint: string,
    private token?: string
  ) {}

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.endpoint) return null;
    try {
      const res = await fetch(`${this.endpoint}/get/${encodeURIComponent(key)}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return (data?.result ?? null) as T;
    } catch (err) {
      console.warn('RemoteRedisCacheDriver get failed:', err);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    if (!this.endpoint) return;
    try {
      const ttlSec = Math.max(1, Math.floor(ttlMs / 1000));
      await fetch(`${this.endpoint}/set/${encodeURIComponent(key)}?ex=${ttlSec}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ value }),
      });
    } catch (err) {
      console.warn('RemoteRedisCacheDriver set failed:', err);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.endpoint) return;
    try {
      await fetch(`${this.endpoint}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch (err) {
      console.warn('RemoteRedisCacheDriver delete failed:', err);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    if (!this.endpoint) return;
    try {
      await fetch(`${this.endpoint}/del-pattern`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ pattern }),
      });
    } catch (err) {
      console.warn('RemoteRedisCacheDriver deletePattern failed:', err);
    }
  }

  async clear(): Promise<void> {
    // Intentionally no-op to prevent wiping full remote Redis instance
  }
}

/**
 * Universal Multi-Tier Caching Service
 * - L1: Fast In-Memory Map (Instant, active right now)
 * - L2: Persistent LocalStorage (For cross-tab or offline needs)
 * - L3: Redis HTTP Gateway (Plug-and-play future remote distributed cache)
 */
@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private memoryDriver = new MemoryCacheDriver();
  private localDriver = new LocalStorageCacheDriver();
  private remoteDriver: RemoteRedisCacheDriver | null = null;

  // In-flight promise tracker to prevent duplicate concurrent queries (Cache stampede protection)
  private inFlightRequests = new Map<string, Promise<any>>();

  private readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initRemoteDriverIfConfigured();
  }

  private initRemoteDriverIfConfigured(): void {
    const redisConfig = (environment as any).redisCache;
    if (redisConfig?.enabled && redisConfig?.endpoint) {
      this.remoteDriver = new RemoteRedisCacheDriver(redisConfig.endpoint, redisConfig.token);
      console.log('⚡ CacheService: Remote Redis cache driver connected.');
    }
  }

  /**
   * Generates a namespaced cache key
   */
  private buildKey(key: string, schoolId?: string): string {
    const sanitizedKey = key.trim();
    if (schoolId) {
      return `school:${schoolId}:${sanitizedKey}`;
    }
    return sanitizedKey;
  }

  /**
   * Synchronously or asynchronously retrieve an item from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const fullKey = this.buildKey(key, options?.schoolId);

    // 1. Check L1 In-Memory
    const memVal = this.memoryDriver.get<T>(fullKey);
    if (memVal !== null) {
      return memVal;
    }

    // 2. Check L2 LocalStorage if persist was enabled
    if (options?.persist) {
      const localVal = this.localDriver.get<T>(fullKey);
      if (localVal !== null) {
        // Backfill L1
        this.memoryDriver.set(fullKey, localVal, options?.ttlMs ?? this.DEFAULT_TTL_MS);
        return localVal;
      }
    }

    // 3. Check L3 Remote Redis if configured
    if (this.remoteDriver) {
      const remoteVal = await this.remoteDriver.get<T>(fullKey);
      if (remoteVal !== null) {
        this.memoryDriver.set(fullKey, remoteVal, options?.ttlMs ?? this.DEFAULT_TTL_MS);
        return remoteVal;
      }
    }

    return null;
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, options?.schoolId);
    const ttlMs = options?.ttlMs ?? this.DEFAULT_TTL_MS;

    // 1. Write L1 In-Memory
    this.memoryDriver.set(fullKey, value, ttlMs);

    // 2. Write L2 LocalStorage if requested
    if (options?.persist) {
      this.localDriver.set(fullKey, value, ttlMs);
    }

    // 3. Write L3 Remote Redis if active
    if (this.remoteDriver) {
      await this.remoteDriver.set(fullKey, value, ttlMs);
    }
  }

  /**
   * Safe fetch with stampede protection (Thundering herd guard)
   * If 5 components call getOrFetch simultaneously, the fetcher runs only ONCE.
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const fullKey = this.buildKey(key, options?.schoolId);

    // 1. Try cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // 2. Check if a request is already in flight for this key
    if (this.inFlightRequests.has(fullKey)) {
      return this.inFlightRequests.get(fullKey)! as Promise<T>;
    }

    // 3. Execute fetcher and record in-flight promise
    const fetchPromise = (async () => {
      try {
        const result = await fetcher();
        if (result !== undefined && result !== null) {
          await this.set(key, result, options);
        }
        return result;
      } finally {
        this.inFlightRequests.delete(fullKey);
      }
    })();

    this.inFlightRequests.set(fullKey, fetchPromise);
    return fetchPromise;
  }

  /**
   * Invalidate specific key
   */
  async delete(key: string, schoolId?: string): Promise<void> {
    const fullKey = this.buildKey(key, schoolId);
    this.memoryDriver.delete(fullKey);
    this.localDriver.delete(fullKey);
    if (this.remoteDriver) {
      await this.remoteDriver.delete(fullKey);
    }
  }

  /**
   * Invalidate all keys matching a wildcard pattern, e.g. "routes:*" or "invoices:*"
   */
  async deletePattern(pattern: string, schoolId?: string): Promise<void> {
    const fullPattern = this.buildKey(pattern, schoolId);
    this.memoryDriver.deletePattern(fullPattern);
    this.localDriver.deletePattern(fullPattern);
    if (this.remoteDriver) {
      await this.remoteDriver.deletePattern(fullPattern);
    }
  }

  /**
   * Clear all local caches
   */
  clear(): void {
    this.memoryDriver.clear();
    this.localDriver.clear();
    this.inFlightRequests.clear();
  }
}
