import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { validateEnvironment } = await import("@/server/config/env-validator");

afterEach(() => {
  vi.unstubAllEnvs();
});

function configureProductionClerkEnvironment() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("LABRIX_IDENTITY_MODE", "clerk");
  vi.stubEnv("DATABASE_URL", "postgresql://example.invalid/trace");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_example");
  vi.stubEnv("CLERK_SECRET_KEY", "sk_test_example");
  vi.stubEnv("CLERK_WEBHOOK_SECRET", "whsec_example");
  vi.stubEnv("LABRIX_EXECUTION_PROVIDER", "remote-docker");
  vi.stubEnv("LABRIX_JAVA_RUNNER_URL", "https://java.example.edu/v1/execute/java");
  vi.stubEnv("LABRIX_CPP_RUNNER_URL", "https://cpp.example.edu/v1/execute/cpp");
  vi.stubEnv("LABRIX_RUNNER_BEARER_TOKEN", "a-secure-runner-token-with-32-characters");
}

describe("production environment validation", () => {
  it("requires a shared rate-limit store in deployed production", () => {
    configureProductionClerkEnvironment();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const result = validateEnvironment();

    expect(result.isValid).toBe(false);
    expect(result.missingRequired).toEqual(expect.arrayContaining([
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
    ]));
  });

  it("permits the acknowledged single-host professor demo without Upstash", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("LABRIX_IDENTITY_MODE", "demo");
    vi.stubEnv("DATABASE_URL", "postgresql://example.invalid/trace_demo");
    vi.stubEnv("LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD", "true");
    vi.stubEnv("NEXT_PUBLIC_LABRIX_DEMO_RUNTIME", "local-real");
    vi.stubEnv("LABRIX_EXECUTION_PROVIDER", "local-docker");
    vi.stubEnv("LABRIX_JAVA_RUNNER_URL", "http://127.0.0.1:4010/v1/execute/java");
    vi.stubEnv("LABRIX_CPP_RUNNER_URL", "http://127.0.0.1:4020/v1/execute/cpp");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const result = validateEnvironment();

    expect(result.isValid).toBe(true);
    expect(result.warnings).toContain(
      "Shared rate limiting is not configured for this supervised single-host demo.",
    );
  });

  it("rejects demo identity in an ordinary production deployment", () => {
    configureProductionClerkEnvironment();
    vi.stubEnv("LABRIX_IDENTITY_MODE", "demo");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "upstash-token");

    const result = validateEnvironment();

    expect(result.isValid).toBe(false);
    expect(result.missingRequired).toContain("LABRIX_IDENTITY_MODE=clerk");
  });

  it("rejects local runners in an ordinary production deployment", () => {
    configureProductionClerkEnvironment();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://example.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "upstash-token");
    vi.stubEnv("LABRIX_EXECUTION_PROVIDER", "local-docker");
    vi.stubEnv("LABRIX_JAVA_RUNNER_URL", "http://127.0.0.1:4010/v1/execute/java");
    vi.stubEnv("LABRIX_CPP_RUNNER_URL", "http://127.0.0.1:4020/v1/execute/cpp");

    const result = validateEnvironment();

    expect(result.isValid).toBe(false);
    expect(result.missingRequired).toContain("LABRIX_EXECUTION_PROVIDER=remote-docker");
  });
});
