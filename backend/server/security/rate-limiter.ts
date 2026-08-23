import { createHash } from "node:crypto";

export interface RateLimitConfig {
  /** Maximum number of allowed requests in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Optional custom identifier prefix */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

export interface RateLimiterStore {
  consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
}

/**
 * In-memory sliding window rate limiter store.
 * Automatically cleans up expired timestamps to avoid memory leaks.
 */
export class MemoryRateLimiterStore implements RateLimiterStore {
  private timestamps = new Map<string, number[]>();
  private lastCleanup = Date.now();

  private cleanup(now: number) {
    if (now - this.lastCleanup < 60_000) return;
    this.lastCleanup = now;
    for (const [key, times] of this.timestamps.entries()) {
      const valid = times.filter((t) => now - t < 3_600_000); // 1 hour retention max
      if (valid.length === 0) {
        this.timestamps.delete(key);
      } else {
        this.timestamps.set(key, valid);
      }
    }
  }

  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    this.cleanup(now);

    const windowMs = windowSeconds * 1000;
    const cutoff = now - windowMs;

    const existing = this.timestamps.get(key) ?? [];
    const recent = existing.filter((t) => t > cutoff);

    if (recent.length >= limit) {
      const oldestInWindow = recent[0] ?? now;
      const resetTime = oldestInWindow + windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));
      return {
        success: false,
        limit,
        remaining: 0,
        resetAt: new Date(resetTime),
        retryAfterSeconds,
      };
    }

    recent.push(now);
    this.timestamps.set(key, recent);

    const resetTime = now + windowMs;
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - recent.length),
      resetAt: new Date(resetTime),
      retryAfterSeconds: 0,
    };
  }

  async reset(key: string): Promise<void> {
    this.timestamps.delete(key);
  }
}

interface RedisLikeMulti {
  zremrangebyscore: (key: string, min: number, max: number) => RedisLikeMulti;
  zcard: (key: string) => RedisLikeMulti;
  zadd: (key: string, score: number, member: string) => RedisLikeMulti;
  expire: (key: string, seconds: number) => RedisLikeMulti;
  exec: () => Promise<Array<[Error | null, unknown]>>;
}

interface RedisLikeClient {
  multi: () => RedisLikeMulti;
  del: (key: string) => Promise<unknown>;
}

declare global {
  var __TRACE_REDIS_CLIENT__: RedisLikeClient | undefined;
}

/**
 * Redis-based rate limiter store using atomic multi commands.
 * Falls back gracefully to memory if Redis is unavailable or unconfigured.
 */
export class RedisRateLimiterStore implements RateLimiterStore {
  private fallbackStore = new MemoryRateLimiterStore();
  private redisClient: RedisLikeClient | null = null;
  private isRedisAvailable = false;

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL;
    if (url) {
      try {
        // Attempt lazy dynamic import or connection if ioredis/redis is installed
        // If not installed, falls back cleanly to memory
        const IORedis = globalThis.__TRACE_REDIS_CLIENT__;
        if (IORedis) {
          this.redisClient = IORedis;
          this.isRedisAvailable = true;
        }
      } catch {
        this.isRedisAvailable = false;
      }
    }
  }

  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    if (!this.isRedisAvailable || !this.redisClient) {
      return this.fallbackStore.consume(key, limit, windowSeconds);
    }

    try {
      const now = Date.now();
      const windowMs = windowSeconds * 1000;
      const clearBefore = now - windowMs;
      const redisKey = `ratelimit:${key}`;

      const multi = this.redisClient.multi();
      multi.zremrangebyscore(redisKey, 0, clearBefore);
      multi.zcard(redisKey);
      multi.zadd(redisKey, now, `${now}-${Math.random()}`);
      multi.expire(redisKey, windowSeconds + 10);

      const results = await multi.exec();
      const currentCount = results ? Number(results[1][1]) : 0;

      if (currentCount >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          resetAt: new Date(now + windowMs),
          retryAfterSeconds: windowSeconds,
        };
      }

      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - (currentCount + 1)),
        resetAt: new Date(now + windowMs),
        retryAfterSeconds: 0,
      };
    } catch {
      return this.fallbackStore.consume(key, limit, windowSeconds);
    }
  }

  async reset(key: string): Promise<void> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(`ratelimit:${key}`);
      } catch {}
    }
    await this.fallbackStore.reset(key);
  }
}

// Global default store instance
const defaultStore: RateLimiterStore = process.env.REDIS_URL
  ? new RedisRateLimiterStore(process.env.REDIS_URL)
  : new MemoryRateLimiterStore();

/**
 * Main RateLimiter entry point.
 */
export class RateLimiter {
  private store: RateLimiterStore;

  constructor(store: RateLimiterStore = defaultStore) {
    this.store = store;
  }

  /**
   * Consume a rate limit token for the given key and config.
   */
  async check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const prefix = config.prefix ?? "default";
    const safeKey = `${prefix}:${createHash("sha256").update(identifier).digest("hex").slice(0, 24)}`;
    return this.store.consume(safeKey, config.maxRequests, config.windowSeconds);
  }

  /**
   * Reset rate limit state for a key.
   */
  async reset(identifier: string, prefix = "default"): Promise<void> {
    const safeKey = `${prefix}:${createHash("sha256").update(identifier).digest("hex").slice(0, 24)}`;
    return this.store.reset(safeKey);
  }
}

export const globalRateLimiter = new RateLimiter();
