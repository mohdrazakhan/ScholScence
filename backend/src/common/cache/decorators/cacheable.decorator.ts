import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'CACHEABLE_KEY';
export const CACHE_EVICT_KEY = 'CACHE_EVICT_KEY';

export interface CacheableOptions {
  /** Prefix for the cache key, e.g. 'fees:structures' */
  prefix?: string;
  /** TTL in seconds (default: 300) */
  ttlSeconds?: number;
  /** Optional custom key extractor based on method arguments */
  keyGenerator?: (...args: any[]) => string;
}

export interface CacheEvictOptions {
  /** Pattern to invalidate, e.g. 'fees:*' or 'transport:*' */
  pattern: string;
}

/**
 * Decorator to mark a method result as cached
 */
export const Cacheable = (options?: CacheableOptions) =>
  SetMetadata(CACHEABLE_KEY, options || {});

/**
 * Decorator to evict cached keys matching a pattern when method executes
 */
export const CacheEvict = (options: CacheEvictOptions) =>
  SetMetadata(CACHE_EVICT_KEY, options);
