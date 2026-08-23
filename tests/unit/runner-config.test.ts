import { describe, expect, it } from "vitest";
import { boundedPositiveInteger, configuredRunnerHost } from "@/runner/config";

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

describe("runner listener configuration", () => {
  it.each(["127.0.0.1", "0.0.0.0", "::1", "::"])(
    "accepts supported listener host %s",
    (host) => expect(configuredRunnerHost(host)).toBe(host),
  );

  it("defaults to loopback", () => {
    expect(configuredRunnerHost(undefined)).toBe("127.0.0.1");
  });

  it.each(["runner.example.edu", "/tmp/runner.sock", " 10.0.0.1 "])(
    "rejects unsupported listener host %s",
    (host) => expect(() => configuredRunnerHost(host)).toThrow(/RUNNER_HOST/),
  );
});
