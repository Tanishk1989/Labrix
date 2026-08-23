import { describe, expect, it } from "vitest";
import {
  checkEnrollmentEligibility,
  generateCryptographicJoinCode,
  isValidJoinCodeFormat,
  normalizeJoinCode,
} from "@/server/classrooms/join-code-generator";

describe("generateCryptographicJoinCode", () => {
  it("generates unique high-entropy join codes matching format", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const code = generateCryptographicJoinCode();
      expect(code).toMatch(/^TR-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);
      expect(codes.has(code)).toBe(false);
      codes.add(code);
    }
  });

  it("supports custom prefixes and group configurations", () => {
    const custom = generateCryptographicJoinCode({ prefix: "CS101", groupLength: 3, groups: 2 });
    expect(custom).toMatch(/^CS101-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{3}$/);
  });

  it("normalizes and validates join code format", () => {
    expect(normalizeJoinCode("  tr-8k4m-9x2p  ")).toBe("TR-8K4M-9X2P");
    expect(isValidJoinCodeFormat("TR-8K4M-9X2P")).toBe(true);
    expect(isValidJoinCodeFormat("CLASS-ABCDE")).toBe(true);
    expect(isValidJoinCodeFormat("DEMO1234")).toBe(true);
    expect(isValidJoinCodeFormat("!INVALID!")).toBe(false);
  });
});

describe("checkEnrollmentEligibility", () => {
  const baseRules = {
    status: "ACTIVE" as const,
    enrollmentOpen: true,
    enrollmentStartsAt: null,
    enrollmentEndsAt: null,
    joinCodeExpiresAt: null,
  };

  it("permits enrollment when rules are open", () => {
    expect(checkEnrollmentEligibility(baseRules)).toEqual({ eligible: true });
  });

  it("blocks enrollment when classroom is archived", () => {
    const res = checkEnrollmentEligibility({ ...baseRules, status: "ARCHIVED" });
    expect(res).toEqual({ eligible: false, reason: "CLASSROOM_ARCHIVED" });
  });

  it("blocks enrollment when enrollmentOpen is false", () => {
    const res = checkEnrollmentEligibility({ ...baseRules, enrollmentOpen: false });
    expect(res).toEqual({ eligible: false, reason: "ENROLLMENT_CLOSED" });
  });

  it("blocks enrollment when join code has expired", () => {
    const past = new Date(Date.now() - 3600_000);
    const res = checkEnrollmentEligibility({ ...baseRules, joinCodeExpiresAt: past });
    expect(res).toEqual({ eligible: false, reason: "JOIN_CODE_EXPIRED" });
  });

  it("blocks enrollment before enrollmentStartsAt window", () => {
    const future = new Date(Date.now() + 3600_000);
    const res = checkEnrollmentEligibility({ ...baseRules, enrollmentStartsAt: future });
    expect(res).toEqual({ eligible: false, reason: "ENROLLMENT_NOT_STARTED" });
  });

  it("blocks enrollment after enrollmentEndsAt window", () => {
    const past = new Date(Date.now() - 3600_000);
    const res = checkEnrollmentEligibility({ ...baseRules, enrollmentEndsAt: past });
    expect(res).toEqual({ eligible: false, reason: "ENROLLMENT_ENDED" });
  });
});
