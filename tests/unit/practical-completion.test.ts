import { describe, expect, it } from "vitest";
import { summarizePracticalCompletion } from "@/features/classes/practical-completion";

describe("practical completion summary", () => {
  const students = ["student-1", "student-2", "student-3"];

  it("reports zero submissions", () => {
    expect(summarizePracticalCompletion(students, [])).toEqual({
      submittedCount: 0,
      pendingCount: 3,
      completionPercentage: 0,
    });
  });

  it("counts one student with one submission", () => {
    expect(summarizePracticalCompletion(students, ["student-1"])).toEqual({
      submittedCount: 1,
      pendingCount: 2,
      completionPercentage: 33,
    });
  });

  it("counts one student with multiple attempts only once", () => {
    expect(
      summarizePracticalCompletion(students, ["student-1", "student-1"]),
    ).toEqual({
      submittedCount: 1,
      pendingCount: 2,
      completionPercentage: 33,
    });
  });

  it("counts multiple submitted students and excludes non-members", () => {
    expect(
      summarizePracticalCompletion(students, [
        "student-1",
        "student-2",
        "former-student",
      ]),
    ).toEqual({
      submittedCount: 2,
      pendingCount: 1,
      completionPercentage: 67,
    });
  });
});
