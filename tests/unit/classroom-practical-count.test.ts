import { describe, expect, it } from "vitest";
import { countVisiblePracticals } from "@/features/classes/my-classes-view-model";

describe("classroom-list practical count", () => {
  const tasks = [
    { status: "PUBLISHED" as const },
    { status: "PUBLISHED" as const },
    { status: "DRAFT" as const },
  ];

  it("counts only the latest published practical exposed to a student", () => {
    expect(countVisiblePracticals(tasks, "STUDENT")).toBe(1);
  });

  it("counts every published practical exposed to a teacher", () => {
    expect(countVisiblePracticals(tasks, "TEACHER")).toBe(2);
  });

  it("reports zero when no practical is published", () => {
    expect(countVisiblePracticals([{ status: "DRAFT" }], "STUDENT")).toBe(0);
  });
});
