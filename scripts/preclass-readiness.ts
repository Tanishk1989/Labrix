export function ageWithin(value: string | undefined, maximumAgeMs: number, now = Date.now()) {
  if (!value) return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  const age = now - timestamp;
  return age >= 0 && age <= maximumAgeMs;
}

export function evaluateOperationalEvidence(input: {
  backupVerifiedAt?: string;
  restoreDrillVerifiedAt?: string;
  authenticatedSmokeVerifiedAt?: string;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const failures: string[] = [];
  if (!ageWithin(input.backupVerifiedAt, 26 * 60 * 60 * 1_000, now)) {
    failures.push("No verified off-host backup was recorded in the last 26 hours.");
  }
  if (!ageWithin(input.restoreDrillVerifiedAt, 120 * 24 * 60 * 60 * 1_000, now)) {
    failures.push("No successful isolated restore drill was recorded in the last 120 days.");
  }
  if (!ageWithin(input.authenticatedSmokeVerifiedAt, 7 * 24 * 60 * 60 * 1_000, now)) {
    failures.push("No real teacher/student authenticated smoke test was recorded in the last 7 days.");
  }
  return failures;
}
