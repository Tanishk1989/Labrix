import { describe, expect, it } from "vitest";
import { executionPollDelay } from "@/features/workspace/execution-polling";

describe("execution status polling", () => {
  it("checks a newly queued or running job quickly", () => {
    expect(executionPollDelay("QUEUED", 0)).toBe(350);
    expect(executionPollDelay("RUNNING", 0)).toBe(250);
  });

  it("backs off to protect the database while a job remains active", () => {
    expect(executionPollDelay("QUEUED", 20)).toBe(2_000);
    expect(executionPollDelay("RUNNING", 20)).toBe(1_250);
  });
});
