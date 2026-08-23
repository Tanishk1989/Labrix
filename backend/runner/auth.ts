import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export function runnerRequestIsAuthorized(
  request: IncomingMessage,
  bearerToken: string | undefined,
) {
  if (!bearerToken) return process.env.NODE_ENV !== "production";
  const expected = Buffer.from(`Bearer ${bearerToken}`);
  const actual = Buffer.from(request.headers.authorization ?? "");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function configuredRunnerBearerToken() {
  const value = process.env.LABRIX_RUNNER_BEARER_TOKEN;
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) {
    throw new Error(
      "LABRIX_RUNNER_BEARER_TOKEN with at least 32 characters is required in production.",
    );
  }
  return value;
}
