import { describe, expect, it, vi } from "vitest";
import {
  MemoryRateLimiterStore,
  RateLimiter,
  UpstashRateLimiterStore,
} from "@/server/security/rate-limiter";
import { RATE_LIMIT_CONFIGS } from "@/server/security/rate-limit-configs";

describe("RateLimiter sliding window", () => {
  it("allows requests under the rate limit threshold", async () => {
    const limiter = new RateLimiter(new MemoryRateLimiterStore());
    const config = { maxRequests: 3, windowSeconds: 60, prefix: "test:limit" };

    const res1 = await limiter.check("user-1", config);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await limiter.check("user-1", config);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await limiter.check("user-1", config);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests exceeding the rate limit and reports retryAfter", async () => {
    const limiter = new RateLimiter(new MemoryRateLimiterStore());
    const config = { maxRequests: 2, windowSeconds: 10, prefix: "test:block" };

    await limiter.check("user-2", config);
    await limiter.check("user-2", config);

    const blocked = await limiter.check("user-2", config);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(10);
  });

  it("isolates limits across different identifiers and prefixes", async () => {
    const limiter = new RateLimiter(new MemoryRateLimiterStore());
    const config = { maxRequests: 1, windowSeconds: 60, prefix: "test:isolate" };

    const userA = await limiter.check("user-a", config);
    expect(userA.success).toBe(true);

    const userB = await limiter.check("user-b", config);
    expect(userB.success).toBe(true);

    const userABlocked = await limiter.check("user-a", config);
    expect(userABlocked.success).toBe(false);
  });

  it("resets limits when explicitly requested", async () => {
    const limiter = new RateLimiter(new MemoryRateLimiterStore());
    const config = { maxRequests: 1, windowSeconds: 60, prefix: "test:reset" };

    await limiter.check("user-reset", config);
    const blocked = await limiter.check("user-reset", config);
    expect(blocked.success).toBe(false);

    await limiter.reset("user-reset", config.prefix);
    const allowedAfterReset = await limiter.check("user-reset", config);
    expect(allowedAfterReset.success).toBe(true);
  });

  it("provides standard configuration presets", () => {
    expect(RATE_LIMIT_CONFIGS.JOIN_CODE.maxRequests).toBe(5);
    expect(RATE_LIMIT_CONFIGS.JOIN_CODE.windowSeconds).toBe(600);
    expect(RATE_LIMIT_CONFIGS.CODE_RUN.maxRequests).toBe(10);
    expect(RATE_LIMIT_CONFIGS.SUBMISSION.maxRequests).toBe(5);
    expect(RATE_LIMIT_CONFIGS.AUTOSAVE.maxRequests).toBe(60);
    expect(RATE_LIMIT_CONFIGS.AI_GENERATION.maxRequests).toBe(5);
  });
});

describe("Upstash shared rate-limit store", () => {
  it("uses an authenticated atomic script and maps the shared count", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ result: [1, 2, Date.now()] }), { status: 200 }),
    );
    const store = new UpstashRateLimiterStore(
      "https://example.upstash.io",
      "secret-token",
      fetchImplementation,
    );

    const result = await store.consume("safe-key", 5, 60);

    expect(result).toMatchObject({ success: true, limit: 5, remaining: 3 });
    const [url, options] = fetchImplementation.mock.calls[0];
    expect(String(url)).toContain("/eval/");
    expect(String(url)).toContain("ratelimit%3Asafe-key");
    expect(options?.headers).toEqual({ Authorization: "Bearer secret-token" });
  });
});
