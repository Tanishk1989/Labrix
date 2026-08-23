import type { IncomingMessage } from "node:http";
import { describe, expect, it } from "vitest";
import { runnerRequestIsAuthorized } from "@/runner/auth";

function requestWithAuthorization(authorization?: string) {
  return { headers: { authorization } } as IncomingMessage;
}

describe("runner request authentication", () => {
  const token = "test-runner-token-at-least-32-characters";

  it("accepts only the exact bearer credential", () => {
    expect(runnerRequestIsAuthorized(requestWithAuthorization(`Bearer ${token}`), token)).toBe(true);
    expect(runnerRequestIsAuthorized(requestWithAuthorization(`Bearer ${token}x`), token)).toBe(false);
    expect(runnerRequestIsAuthorized(requestWithAuthorization(), token)).toBe(false);
  });
});
