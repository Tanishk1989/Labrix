import { describe, expect, it } from "vitest";
import { ageWithin, evaluateOperationalEvidence } from "../../scripts/preclass-readiness";

const now = Date.parse("2026-09-01T12:00:00.000Z");

describe("pre-class operational evidence", () => {
  it("accepts recent evidence timestamps", () => {
    expect(ageWithin("2026-09-01T11:00:00.000Z", 2 * 60 * 60 * 1_000, now)).toBe(true);
    expect(evaluateOperationalEvidence({
      backupVerifiedAt: "2026-09-01T11:00:00.000Z",
      restoreDrillVerifiedAt: "2026-08-01T12:00:00.000Z",
      authenticatedSmokeVerifiedAt: "2026-08-31T12:00:00.000Z",
      now,
    })).toEqual([]);
  });

  it("fails missing, future, invalid, and stale evidence", () => {
    expect(ageWithin("invalid", 1_000, now)).toBe(false);
    expect(ageWithin("2026-09-01T13:00:00.000Z", 2 * 60 * 60 * 1_000, now)).toBe(false);
    expect(evaluateOperationalEvidence({
      backupVerifiedAt: "2026-08-30T12:00:00.000Z",
      restoreDrillVerifiedAt: undefined,
      authenticatedSmokeVerifiedAt: "invalid",
      now,
    })).toHaveLength(3);
  });
});
