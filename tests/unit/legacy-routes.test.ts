import { describe, expect, it } from "vitest";
import { legacyRouteDestination } from "@/features/navigation/legacy-routes";

describe("legacy route quarantine", () => {
  it("redirects the old root demo to the persisted dashboard", () => {
    expect(legacyRouteDestination(undefined)).toBe("/dashboard");
    expect(legacyRouteDestination([])).toBe("/dashboard");
  });

  it("redirects old classroom practical lists to the persisted list", () => {
    expect(
      legacyRouteDestination(["classes", "dsa/2026", "tasks"]),
    ).toBe("/practicals?classroom=dsa%2F2026");
  });

  it("redirects old task submission history to persisted submissions", () => {
    expect(
      legacyRouteDestination(["tasks", "binary trees", "my-submissions"]),
    ).toBe("/submissions?practical=binary+trees");
  });

  it("quarantines unknown paths instead of rendering mock data", () => {
    expect(legacyRouteDestination(["legacy", "unknown"])).toBeNull();
    expect(legacyRouteDestination(["tasks", "task-1", "unexpected"])).toBeNull();
  });
});
