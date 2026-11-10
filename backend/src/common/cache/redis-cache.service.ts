import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICacheService } from './cache.interface';
import { MemoryCacheService } from './memory-cache.service';

@Injectable()
export class RedisCacheService implements ICacheService, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redisClient: any = null;
  private isConnected = false;
  private fallbackMemoryCache = new MemoryCacheService();
  private readonly keyPrefix = 'schoolsense:';

  constructor(private configService: ConfigService) {}

  getProviderName(): string {
    return this.isConnected ? 'redis' : 'redis-fallback-memory';
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.redisClient && typeof this.redisClient.quit === 'function') {
      try {
        await this.redisClient.quit();
      } catch (err) {
        this.logger.warn(`Error disconnecting Redis: ${err}`);
      }
    }
  }

  private async connect(): Promise<void> {
    const redisUrl =
      this.configService.get<string>('REDIS_URL') ||
      process.env.REDIS_URL ||
      '';

    if (!redisUrl) {
      this.logger.warn('REDIS_URL not configured. Operating in graceful in-memory fallback mode.');
      return;
    }

    try {
      // Dynamic import of ioredis so the project compiles and runs even if ioredis package is optional
      // @ts-ignore
      const ioredisModule = await import('ioredis').catch(() => null);
      if (!ioredisModule) {
        this.logger.warn('ioredis package is not installed. To activate native Redis, run: npm install ioredis. Falling back to memory cache.');
        return;
      }

      const Redis = ioredisModule.default || ioredisModule;
      this.redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.warn('Redis connection retry limit reached. Falling back to in-memory cache.');
            return null; // Stop retrying
          }
          return Math.min(times * 500, 2000);
        },
      });

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.logger.log(`⚡ Connected to Redis at ${this.sanitizeUrl(redisUrl)}`);
      });

      this.redisClient.on('error', (err: any) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error: ${err?.message || err}. Falling back to memory cache.`);
      });
    } catch (err) {
      this.isConnected = false;
      this.logger.warn(`Failed to initialize Redis client: ${err}. Falling back to memory cache.`);
    }
  }

  private sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.password) {
        parsed.password = '***';
      }
      return parsed.toString();
    } catch {
      return url.replace(/:[^:@]+@/, ':***@');
    }
  }

  private formatKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redisClient) {
      return this.fallbackMemoryCache.get<T>(key);
    }

    try {
      const data = await this.redisClient.get(this.formatKey(key));
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      this.logger.warn(`Redis GET failed for key "${key}", checking memory fallback: ${err}`);
      return this.fallbackMemoryCache.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    // Keep local fallback updated
    this.fallbackMemoryCache.set(key, value, ttlSeconds);

    if (!this.isConnected || !this.redisClient) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      const formattedKey = this.formatKey(key);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.redisClient.set(formattedKey, serialized, 'EX', ttlSeconds);
      } else {
        await this.redisClient.set(formattedKey, serialized);
      }
    } catch (err) {
      this.logger.warn(`Redis SET failed for key "${key}": ${err}`);
    }
  }

  async del(key: string | string[]): Promise<void> {
    await this.fallbackMemoryCache.del(key);

    if (!this.isConnected || !this.redisClient) {
      return;
    }

    try {
      const keys = Array.isArray(key) ? key.map((k) => this.formatKey(k)) : [this.formatKey(key)];
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Redis DEL failed: ${err}`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    await this.fallbackMemoryCache.delByPattern(pattern);

    if (!this.isConnected || !this.redisClient) {
      return;
    }

    try {
      const fullPattern = this.formatKey(pattern);
      const keys = await this.redisClient.keys(fullPattern);
      if (keys && keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Redis DEL pattern failed for "${pattern}": ${err}`);
    }
  }

  async has(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redisClient) {
      return this.fallbackMemoryCache.has(key);
    }

    try {
      const exists = await this.redisClient.exists(this.formatKey(key));
      return exists === 1;
    } catch (err) {
      return this.fallbackMemoryCache.has(key);
    }
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await factory();
    if (fresh !== undefined && fresh !== null) {
      await this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }

  async flush(): Promise<void> {
    await this.fallbackMemoryCache.flush();

    if (!this.isConnected || !this.redisClient) {
      return;
    }

    try {
      const keys = await this.redisClient.keys(`${this.keyPrefix}*`);
      if (keys && keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } catch (err) {
      this.logger.warn(`Redis flush failed: ${err}`);
    }
  }
}
