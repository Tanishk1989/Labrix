import { describe, expect, it } from "vitest";
import {
  configuredRelease,
  diagnosticsTokenConfigured,
  isDiagnosticsRequestAuthorized,
} from "@/server/observability/runtime-diagnostics";

const token = "diagnostics-token-that-is-at-least-32-characters";

describe("runtime diagnostics boundary", () => {
  it("requires a long configured bearer token and compares it exactly", () => {
    const env = { TRACE_DIAGNOSTICS_TOKEN: token };
    expect(diagnosticsTokenConfigured(env)).toBe(true);
    expect(isDiagnosticsRequestAuthorized(`Bearer ${token}`, env)).toBe(true);
    expect(isDiagnosticsRequestAuthorized("Bearer wrong", env)).toBe(false);
    expect(isDiagnosticsRequestAuthorized(null, env)).toBe(false);
  });

  it("keeps diagnostics disabled for missing or short tokens", () => {
    const env = { TRACE_DIAGNOSTICS_TOKEN: "short" };
    expect(diagnosticsTokenConfigured(env)).toBe(false);
    expect(isDiagnosticsRequestAuthorized("Bearer short", env)).toBe(false);
  });

  it("uses an explicit release before platform commit identifiers", () => {
    expect(configuredRelease({
      TRACE_RELEASE_SHA: "release-1",
      VERCEL_GIT_COMMIT_SHA: "vercel-1",
    })).toBe("release-1");
    expect(configuredRelease({ GITHUB_SHA: "github-1" })).toBe("github-1");
  });
});
