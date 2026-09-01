import { describe, expect, it } from "vitest";
import { evaluateClubCapacity, summarizeLoad } from "../../scripts/club-capacity";

describe("club capacity gates", () => {
  it("passes only when web, runners, and worker capacity all meet the gate", () => {
    const web = summarizeLoad([100, 200, 300, 400], 0);
    const runners = summarizeLoad([1_000, 2_000, 3_000, 4_000], 0);
    expect(evaluateClubCapacity({ web, runners, executionCapacity: 8 }).status).toBe("PASSED");
  });

  it("blocks an incomplete rehearsal instead of claiming readiness", () => {
    const web = summarizeLoad([100, 200], 0);
    const result = evaluateClubCapacity({ web, runners: null, executionCapacity: null });
    expect(result.status).toBe("BLOCKED");
    expect(result.blocked).toHaveLength(2);
  });

  it("fails slow web traffic, runner errors, and insufficient capacity", () => {
    const web = summarizeLoad([100, 2_500], 0);
    const runners = summarizeLoad([1_000, 2_000], 1);
    const result = evaluateClubCapacity({ web, runners, executionCapacity: 2 });
    expect(result.status).toBe("FAILED");
    expect(result.failures).toEqual(expect.arrayContaining([
      expect.stringContaining("Web p95"),
      expect.stringContaining("runner requests failed"),
      expect.stringContaining("capacity 2"),
    ]));
  });
});
