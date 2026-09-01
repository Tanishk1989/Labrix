import { timingSafeEqual } from "node:crypto";

type RuntimeEnvironment = Readonly<Record<string, string | undefined>>;

export function configuredRelease(env: RuntimeEnvironment = process.env) {
  return env.TRACE_RELEASE_SHA
    ?? env.VERCEL_GIT_COMMIT_SHA
    ?? env.GITHUB_SHA
    ?? "development";
}

export function diagnosticsTokenConfigured(env: RuntimeEnvironment = process.env) {
  return (env.TRACE_DIAGNOSTICS_TOKEN?.length ?? 0) >= 32;
}

export function isDiagnosticsRequestAuthorized(
  authorization: string | null,
  env: RuntimeEnvironment = process.env,
) {
  const expected = env.TRACE_DIAGNOSTICS_TOKEN;
  if (!expected || expected.length < 32 || !authorization?.startsWith("Bearer ")) return false;
  const supplied = authorization.slice("Bearer ".length);
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}
