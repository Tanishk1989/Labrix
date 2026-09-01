import { describe, expect, it } from "vitest";
import { evaluateRuntimeReadiness } from "../../scripts/runtime-readiness";

describe("runtime readiness gates", () => {
  it("passes a healthy deployment with sufficient capacity", () => {
    expect(evaluateRuntimeReadiness({
      publicStatusCode: 200,
      publicStatus: "healthy",
      privateStatusCode: 200,
      minimumCapacity: 8,
      diagnostics: {
        status: "healthy",
        database: { status: "connected" },
        runners: { java: { status: "connected" }, cpp: { status: "connected" } },
        executionQueue: { workersOnline: 1, capacity: 8, failed: 0, oldestQueuedAgeMs: 0 },
      },
    })).toEqual([]);
  });

  it("fails unhealthy services, stale queues, failures, and low capacity", () => {
    const failures = evaluateRuntimeReadiness({
      publicStatusCode: 503,
      publicStatus: "degraded",
      privateStatusCode: 503,
      minimumCapacity: 8,
      diagnostics: {
        status: "degraded",
        database: { status: "error" },
        runners: { java: { status: "error" }, cpp: { status: "error" } },
        executionQueue: { workersOnline: 0, capacity: 2, failed: 1, oldestQueuedAgeMs: 46_000 },
      },
    });
    expect(failures).toHaveLength(9);
  });
});
