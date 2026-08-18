import { describe, expect, it } from "vitest";
import { classifyDemoFixturePresence } from "../../scripts/local-database-state";

describe("local database fixture state", () => {
  it("recognizes a fresh database", () => {
    expect(classifyDemoFixturePresence({
      teacher: false,
      student: false,
      classroom: false,
    })).toBe("fresh");
  });

  it("recognizes complete demo fixtures", () => {
    expect(classifyDemoFixturePresence({
      teacher: true,
      student: true,
      classroom: true,
    })).toBe("ready");
  });

  it("refuses to treat a partial seed as fresh", () => {
    expect(classifyDemoFixturePresence({
      teacher: true,
      student: false,
      classroom: true,
    })).toBe("incomplete");
  });
});
