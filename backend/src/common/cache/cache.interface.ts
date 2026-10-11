export const CACHE_SERVICE = Symbol('CACHE_SERVICE');

export interface CacheEntry<T = any> {
  value: T;
  expiry: number; // epoch ms
}

export interface ICacheService {
  /**
   * Get an item from cache by key
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set an item in cache with optional TTL in seconds (default: 300 = 5 minutes)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Delete one or multiple keys
   */
  del(key: string | string[]): Promise<void>;

  /**
   * Delete all keys matching a wildcard pattern, e.g. "schools:*:routes"
   */
  delByPattern(pattern: string): Promise<void>;

  /**
   * Check if key exists in cache
   */
  has(key: string): Promise<boolean>;

  /**
   * Cache-aside helper with stampede protection (runs factory only if key is absent)
   */
  getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds?: number): Promise<T>;

  /**
   * Clear all cached keys in the namespace
   */
  flush(): Promise<void>;

  /**
   * Returns cache provider type name ('redis' or 'memory')
   */
  getProviderName(): string;
}
