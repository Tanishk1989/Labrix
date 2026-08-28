import { afterEach, describe, expect, it, vi } from "vitest";
import { curatedDemoClassroomId } from "@/server/actors/demo-scope";

afterEach(() => vi.unstubAllEnvs());

describe("curated demo scope", () => {
  it("allows normal actor-scoped demo creation and enrollment by default", () => {
    vi.stubEnv("LABRIX_IDENTITY_MODE", "demo");
    expect(curatedDemoClassroomId("demo-teacher")).toBeUndefined();
  });

  it("restricts the supervised presentation only when explicitly requested", () => {
    vi.stubEnv("LABRIX_IDENTITY_MODE", "demo");
    vi.stubEnv("LABRIX_CURATED_DEMO_ONLY", "true");
    expect(curatedDemoClassroomId("demo-teacher")).toBe("dsa-2026");
    expect(curatedDemoClassroomId("unrelated-user")).toBeUndefined();
  });
});
