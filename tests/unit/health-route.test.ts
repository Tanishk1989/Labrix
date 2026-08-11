import { describe, expect, it } from "vitest";
import { createHealthResponse } from "@/app/api/health/route";

describe("deployment health route", () => {
  it("returns a minimal non-cacheable healthy response", async () => {
    const response = createHealthResponse({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://app:secret@database.internal:5432/labrix",
      LABRIX_IDENTITY_MODE: "clerk",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "publishable-key",
      CLERK_SECRET_KEY: "secret-key",
      LABRIX_EXECUTION_PROVIDER: "mock",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("returns unavailable without exposing configuration or secret values", async () => {
    const secretValue = "do-not-expose-this-secret";
    const response = createHealthResponse({
      NODE_ENV: "production",
      DATABASE_URL: `postgresql://app:${secretValue}@database.internal/labrix`,
      LABRIX_IDENTITY_MODE: "clerk",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "publishable-key",
      CLERK_SECRET_KEY: "",
    });
    const body = JSON.stringify(await response.json());

    expect(response.status).toBe(503);
    expect(body).toBe('{"status":"unavailable"}');
    expect(body).not.toContain(secretValue);
    expect(body).not.toContain("CLERK_SECRET_KEY");
  });
});
