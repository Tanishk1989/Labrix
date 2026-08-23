import { describe, expect, it } from "vitest";
import { boundedPositiveInteger } from "@/runner/config";

describe("runner capacity configuration", () => {
  it("accepts bounded positive integers", () => {
    expect(boundedPositiveInteger("8", 4, { max: 32 })).toBe(8);
    expect(boundedPositiveInteger("1000", 64, { max: 1_000 })).toBe(1_000);
  });

  it.each([undefined, "", "0", "-1", "4.5", "bad", "33"])(
    "uses the safe fallback for invalid value %s",
    (value) => {
      expect(boundedPositiveInteger(value, 4, { max: 32 })).toBe(4);
    },
  );
});
