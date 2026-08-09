import { describe, expect, it } from "vitest";
import { deriveTaskState } from "@/domain/tasks/task-state";

describe("deriveTaskState", () => {
  const now = new Date("2026-08-06T12:00:00Z");
  it("identifies a draft as in progress", () =>
    expect(deriveTaskState({ hasDraft: true, now })).toBe("in_progress"));
  it("marks a late submission", () =>
    expect(
      deriveTaskState({
        hasDraft: false,
        submittedAt: "2026-08-07T12:00:00Z",
        deadline: "2026-08-06T17:00:00Z",
        now,
      }),
    ).toBe("submitted_late"));
  it("marks unsubmitted past-deadline work expired", () =>
    expect(
      deriveTaskState({
        hasDraft: false,
        deadline: "2026-08-05T17:00:00Z",
        now,
      }),
    ).toBe("expired"));
});
