import type { RateLimitConfig } from "./rate-limiter";

/**
 * Standard security rate limit policies across the platform.
 */
export const RATE_LIMIT_CONFIGS = {
  /** Join code attempt limits: 5 attempts per 10 minutes per IP/User to prevent brute force */
  JOIN_CODE: {
    maxRequests: 5,
    windowSeconds: 600,
    prefix: "rl:join_code",
  } satisfies RateLimitConfig,

  /** Student test execution runs: 10 runs per minute per session */
  CODE_RUN: {
    maxRequests: 10,
    windowSeconds: 60,
    prefix: "rl:code_run",
  } satisfies RateLimitConfig,

  /** Student workspace autosaves: 60 per minute per session */
  AUTOSAVE: {
    maxRequests: 60,
    windowSeconds: 60,
    prefix: "rl:autosave",
  } satisfies RateLimitConfig,

  /** Practical submissions: 5 submissions per minute per session */
  SUBMISSION: {
    maxRequests: 5,
    windowSeconds: 60,
    prefix: "rl:submission",
  } satisfies RateLimitConfig,

  /** Webhook endpoints (e.g. Clerk): 120 requests per minute per IP */
  WEBHOOK: {
    maxRequests: 120,
    windowSeconds: 60,
    prefix: "rl:webhook",
  } satisfies RateLimitConfig,

  /** AI viva & feedback generation: 5 requests per minute per teacher */
  AI_GENERATION: {
    maxRequests: 5,
    windowSeconds: 60,
    prefix: "rl:ai_gen",
  } satisfies RateLimitConfig,
} as const;
