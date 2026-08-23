import { createHash, randomUUID } from "node:crypto";

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

type FetchImplementation = typeof fetch;

const upstashSlidingWindowScript = `
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[2])
local count = redis.call('ZCARD', KEYS[1])
if count >= tonumber(ARGV[3]) then
  local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  return {0, count, oldest[2] or ARGV[1]}
end
redis.call('ZADD', KEYS[1], ARGV[1], ARGV[4])
redis.call('EXPIRE', KEYS[1], ARGV[5])
return {1, count + 1, ARGV[1]}
`.trim();

export class UpstashRateLimiterStore implements RateLimiterStore {
  constructor(
    private readonly url: string,
    private readonly token: string,
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {}

  private async command(parts: Array<string | number>): Promise<unknown> {
    const endpoint = `${this.url.replace(/\/$/, "")}/${parts
      .map((part) => encodeURIComponent(String(part)))
      .join("/")}`;
    const response = await this.fetchImplementation(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Shared rate-limit store is unavailable.");
    const body = await response.json() as { result?: unknown; error?: string };
    if (body.error) throw new Error("Shared rate-limit command failed.");
    return body.result;
  }

  async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const result = await this.command([
      "eval",
      upstashSlidingWindowScript,
      1,
      `ratelimit:${key}`,
      now,
      now - windowMs,
      limit,
      `${now}-${randomUUID()}`,
      windowSeconds + 10,
    ]);
    if (!Array.isArray(result) || result.length < 3) {
      throw new Error("Shared rate-limit store returned an invalid response.");
    }
    const success = Number(result[0]) === 1;
    const count = Number(result[1]);
    const oldest = Number(result[2]);
    const resetTime = success ? now + windowMs : oldest + windowMs;
    return {
      success,
      limit,
      remaining: success ? Math.max(0, limit - count) : 0,
      resetAt: new Date(resetTime),
      retryAfterSeconds: success ? 0 : Math.max(1, Math.ceil((resetTime - now) / 1000)),
    };
  }

  async reset(key: string): Promise<void> {
    await this.command(["del", `ratelimit:${key}`]);
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
const defaultStore: RateLimiterStore =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new UpstashRateLimiterStore(
        process.env.UPSTASH_REDIS_REST_URL,
        process.env.UPSTASH_REDIS_REST_TOKEN,
      )
    : process.env.REDIS_URL
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
