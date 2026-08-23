export function boundedPositiveInteger(
  value: string | undefined,
  fallback: number,
  options: { min?: number; max: number },
): number {
  const min = options.min ?? 1;
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > options.max) {
    return fallback;
  }
  return parsed;
}

const ALLOWED_RUNNER_HOSTS = new Set(["127.0.0.1", "0.0.0.0", "::1", "::"]);

export function configuredRunnerHost(value = process.env.RUNNER_HOST) {
  const host = value?.trim() || "127.0.0.1";
  if (!ALLOWED_RUNNER_HOSTS.has(host)) {
    throw new Error(
      "RUNNER_HOST must be a loopback or wildcard IP address (127.0.0.1, 0.0.0.0, ::1, or ::).",
    );
  }
  return host;
}
