# SchoolSense — Pluggable Redis & Multi-Tier Caching Architecture

This guide explains how caching is architected in SchoolSense, how it functions out-of-the-box today (zero extra servers required), and **how to seamlessly activate Redis in the future with a single environment variable or configuration flag**.

---

## 1. Architecture Overview

SchoolSense employs an **Adapter-based Pluggable Caching System** across both Backend microservices and the Angular frontend.

```
                      ┌───────────────────────────────────────┐
                      │            Application Code           │
                      │   (Services / Controllers / Facades)   │
                      └──────────────────┬────────────────────┘
                                         │
                                         ▼
                               [ Cache Abstraction ]
                         (ICacheService / CacheService)
                                         │
                ┌────────────────────────┼────────────────────────┐
                ▼                        ▼                        ▼
         [ L1 Cache ]             [ L2 Cache ]             [ L3 Cache ]
       In-Memory Driver         LocalStorage Driver      Pluggable Redis
     (Zero config, fast)     (Persistent browser tab)  (Future distributed)
```

### Key Principles:
1. **Zero Runtime Friction Today:** The app runs at maximum speed right now using memory buffers and local persistence. No Redis server is required to develop or deploy.
2. **Graceful Failover:** If Redis is enabled but temporarily drops connection or restarts, the system **automatically falls back to memory caching** without throwing 500 errors or crashing.
3. **Multi-Tenant Isolation:** All keys are automatically partitioned by tenant (`schoolsense:school:{schoolId}:...`) to guarantee cross-school data privacy.
4. **Cache Stampede Guard:** Simultaneous requests for the same expired key are de-duplicated so the database or RPC is only executed once.

---

## 2. Backend / Microservice Implementation

Located at [`backend/src/common/cache/`](file:///Users/mohdrazakhan/Projects/ScholScence/backend/src/common/cache/):

- [`cache.interface.ts`](file:///Users/mohdrazakhan/Projects/ScholScence/backend/src/common/cache/cache.interface.ts): Standard contract `ICacheService` (`get`, `set`, `del`, `delByPattern`, `getOrSet`, `has`, `flush`).
- [`memory-cache.service.ts`](file:///Users/mohdrazakhan/Projects/ScholScence/backend/src/common/cache/memory-cache.service.ts): High-performance in-memory cache with TTL eviction.
- [`redis-cache.service.ts`](file:///Users/mohdrazakhan/Projects/ScholScence/backend/src/common/cache/redis-cache.service.ts): Native Redis adapter with connection resilience, prefixing, and fallback.
- [`cache.module.ts`](file:///Users/mohdrazakhan/Projects/ScholScence/backend/src/common/cache/cache.module.ts): Global NestJS module with dynamic factory.

### How to Turn on Redis in the Backend (Future):

When you are ready to spin up Redis (e.g. for GPS tracking, FCM notification queues, or shared API caching):

1. **Start Redis:**
   ```bash
   # Local docker instance
   docker run -d --name schoolsense-redis -p 6379:6379 redis:alpine
   ```
   *(Or provision Upstash / AWS ElastiCache / Redis Cloud)*

2. **Install driver (if not already present):**
   ```bash
   cd backend
   npm install ioredis
   ```

3. **Set the environment variable in `.env`:**
   ```env
   REDIS_URL=redis://localhost:6379
   # Or authenticated cloud Redis:
   # REDIS_URL=rediss://default:password@my-redis.upstash.io:6379
   ```

4. **That's it!**
   The application automatically detects `REDIS_URL`, establishes connection, logs `⚡ Connected to Redis`, and routes all cache operations through Redis with zero changes to any business logic!

---

## 3. Frontend Implementation

Located at [`frontend/src/app/core/services/cache.service.ts`](file:///Users/mohdrazakhan/Projects/ScholScence/frontend/src/app/core/services/cache.service.ts):

- **Injected into:** `ApiService` (`api.cache`) and available across all components.
- **Drivers:**
  - `MemoryCacheDriver`: Instant RAM cache during navigation.
  - `LocalStorageCacheDriver`: Persists across refreshes.
  - `RemoteRedisCacheDriver`: Connects to an HTTP/REST Redis proxy (e.g., Upstash REST or Redis API edge worker).

### How to Activate Redis in the Frontend (Future):

In [`frontend/src/environments/environment.ts`](file:///Users/mohdrazakhan/Projects/ScholScence/frontend/src/environments/environment.ts):
```typescript
export const environment = {
  production: false,
  // ...
  redisCache: {
    enabled: true, // Flip to true
    endpoint: 'https://your-redis-gateway.schoolsense.in',
    token: 'your_optional_bearer_token',
  },
};
```

---

## 4. Usage Example

### In Backend Services:
```typescript
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_SERVICE, ICacheService } from '../common/cache';

@Injectable()
export class TransportService {
  constructor(
    @Inject(CACHE_SERVICE) private cache: ICacheService
  ) {}

  async getActiveRoutes(schoolId: string, academicYearId: string) {
    const key = `school:${schoolId}:session:${academicYearId}:routes`;
    
    // Automatically retrieves from Redis/Memory, or queries DB if missing (with stampede protection):
    return this.cache.getOrSet(key, async () => {
      return this.fetchRoutesFromDatabase(schoolId, academicYearId);
    }, 600); // 10 minutes TTL
  }

  async updateRoute(schoolId: string, routeId: string) {
    // Save to DB...
    // Invalidate routes cache using wildcard pattern:
    await this.cache.delByPattern(`school:${schoolId}:*:routes`);
  }
}
```

### In Frontend Services / Components:
```typescript
// Fast cached fetch with stampede protection
const routes = await this.api.cache.getOrFetch(
  `transport_routes_${activeSessionId}`,
  () => this.api.getTransportRoutes(),
  { ttlMs: 300_000, schoolId: currentSchoolId }
);

// Invalidate on update
await this.api.cache.deletePattern('transport_*', currentSchoolId);
```
