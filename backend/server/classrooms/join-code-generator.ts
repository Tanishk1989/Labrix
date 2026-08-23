import { randomInt } from "node:crypto";

/**
 * Ambiguity-free alphabet for classroom join codes:
 * Excludes easily confused characters (0, O, 1, I, L).
 * 30 distinct uppercase characters = ~39.2 bits of entropy for an 8-character code.
 */
const JOIN_CODE_CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export interface JoinCodeOptions {
  prefix?: string;
  groupLength?: number;
  groups?: number;
}

/**
 * Generate a cryptographically secure random join code.
 * Example output: TR-8K4M-9X2P
 */
export function generateCryptographicJoinCode(options: JoinCodeOptions = {}): string {
  const prefix = options.prefix ?? "TR";
  const groupLength = options.groupLength ?? 4;
  const groups = options.groups ?? 2;

  const parts: string[] = [prefix];
  for (let g = 0; g < groups; g++) {
    let group = "";
    for (let i = 0; i < groupLength; i++) {
      const index = randomInt(0, JOIN_CODE_CHARSET.length);
      group += JOIN_CODE_CHARSET[index];
    }
    parts.push(group);
  }

  return parts.join("-");
}

/**
 * Normalize and validate join code string format.
 */
export function normalizeJoinCode(rawCode: string): string {
  return rawCode.trim().toUpperCase();
}

export function isValidJoinCodeFormat(code: string): boolean {
  const normalized = normalizeJoinCode(code);
  // Match TR-XXXX-XXXX or CLASS-XXXXX or legacy format
  return /^[A-Z0-9]{2,10}(-[A-Z0-9]{3,8})+$/.test(normalized) || /^[A-Z0-9]{4,16}$/.test(normalized);
}

export interface EnrollmentWindowRules {
  enrollmentOpen: boolean;
  enrollmentStartsAt: Date | null;
  enrollmentEndsAt: Date | null;
  joinCodeExpiresAt: Date | null;
  status: "ACTIVE" | "ARCHIVED";
}

export type EnrollmentEligibility =
  | { eligible: true }
  | { eligible: false; reason: "CLASSROOM_ARCHIVED" | "ENROLLMENT_CLOSED" | "ENROLLMENT_NOT_STARTED" | "ENROLLMENT_ENDED" | "JOIN_CODE_EXPIRED" };

/**
 * Check if a classroom is currently accepting student enrollments.
 */
export function checkEnrollmentEligibility(
  rules: EnrollmentWindowRules,
  now: Date = new Date(),
): EnrollmentEligibility {
  if (rules.status !== "ACTIVE") {
    return { eligible: false, reason: "CLASSROOM_ARCHIVED" };
  }

  if (!rules.enrollmentOpen) {
    return { eligible: false, reason: "ENROLLMENT_CLOSED" };
  }

  if (rules.joinCodeExpiresAt && now > rules.joinCodeExpiresAt) {
    return { eligible: false, reason: "JOIN_CODE_EXPIRED" };
  }

  if (rules.enrollmentStartsAt && now < rules.enrollmentStartsAt) {
    return { eligible: false, reason: "ENROLLMENT_NOT_STARTED" };
  }

  if (rules.enrollmentEndsAt && now > rules.enrollmentEndsAt) {
    return { eligible: false, reason: "ENROLLMENT_ENDED" };
  }

  return { eligible: true };
}
