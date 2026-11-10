import { Injectable, Logger } from '@nestjs/common';
import { ICacheService, CacheEntry } from './cache.interface';

@Injectable()
export class MemoryCacheService implements ICacheService {
  private readonly logger = new Logger(MemoryCacheService.name);
  private readonly store = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.logger.log('Active cache driver: In-Memory (Zero dependencies, fast)');
    // Passive cleanup every 60 seconds
    this.cleanupInterval = setInterval(() => this.purgeExpired(), 60_000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  getProviderName(): string {
    return 'memory';
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    this.store.set(key, {
      value,
      expiry: Date.now() + Math.max(1, ttlSeconds) * 1000,
    });
  }

  async del(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];
    for (const k of keys) {
      this.store.delete(k);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const k of this.store.keys()) {
      if (regex.test(k)) {
        this.store.delete(k);
      }
    }
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    if (this.inFlight.has(key)) {
      return this.inFlight.get(key)! as Promise<T>;
    }

    const promise = (async () => {
      try {
        const result = await factory();
        if (result !== undefined && result !== null) {
          await this.set(key, result, ttlSeconds);
        }
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  async flush(): Promise<void> {
    this.store.clear();
    this.inFlight.clear();
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key);
      }
    }
  }
}
