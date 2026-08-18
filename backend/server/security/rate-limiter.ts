import "server-only";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  totalLimit: number;
}

interface WindowBucket {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, WindowBucket>();

// Periodic cleanup of stale memory bucket entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of memoryStore.entries()) {
      if (bucket.resetAt <= now) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

/**
 * Sliding window rate limiter for TRACE / Labrix.
 * Uses distributed Upstash Redis if configured; otherwise uses high-performance in-memory bucket.
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60,
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Upstash Redis (Distributed multi-instance production)
  if (upstashUrl && upstashToken) {
    try {
      const key = `ratelimit:${identifier}`;
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, windowSeconds, "NX"],
          ["TTL", key],
        ]),
      });

      if (res.ok) {
        const results = await res.json();
        const count = results[0]?.result ?? 1;
        const ttl = results[2]?.result ?? windowSeconds;

        return {
          allowed: count <= limit,
          remaining: Math.max(0, limit - count),
          resetMs: ttl * 1000,
          totalLimit: limit,
        };
      }
    } catch (err) {
      console.warn("Upstash rate limit fetch error, falling back to memory:", err);
    }
  }

  // 2. In-Memory Store (High-speed single-instance / development fallback)
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = memoryStore.get(identifier);

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetMs: windowMs,
      totalLimit: limit,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const resetMs = Math.max(0, existing.resetAt - now);

  return {
    allowed: existing.count <= limit,
    remaining,
    resetMs,
    totalLimit: limit,
  };
}

/**
 * Standard predefined rate limit profiles
 */
export const RateLimitPolicies = {
  RUN_CODE: { limit: 10, windowSeconds: 60 },
  SAVE_DRAFT: { limit: 30, windowSeconds: 60 },
  SUBMIT_ATTEMPT: { limit: 3, windowSeconds: 60 },
  AUTH_ATTEMPT: { limit: 5, windowSeconds: 60 },
  AI_GENERATE_VIVA: { limit: 15, windowSeconds: 60 },
};
