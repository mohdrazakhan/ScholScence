import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_SERVICE } from './cache.interface';
import { MemoryCacheService } from './memory-cache.service';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  providers: [
    MemoryCacheService,
    RedisCacheService,
    {
      provide: CACHE_SERVICE,
      useFactory: (config: ConfigService, memoryService: MemoryCacheService, redisService: RedisCacheService) => {
        const redisUrl = config.get<string>('REDIS_URL') || process.env.REDIS_URL;
        if (redisUrl && redisUrl.trim().length > 0) {
          return redisService;
        }
        return memoryService;
      },
      inject: [ConfigService, MemoryCacheService, RedisCacheService],
    },
  ],
  exports: [CACHE_SERVICE, MemoryCacheService, RedisCacheService],
})
export class CacheModule {}
