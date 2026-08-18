import { describe, expect, it } from "vitest";
import {
  deadlineSummary,
  isFutureLocalDeadline,
  serializeLocalDeadline,
} from "@/features/task-authoring/authoring-summary";

describe("teacher authoring summaries", () => {
  it("uses teacher-facing empty and invalid deadline labels", () => {
    expect(deadlineSummary("")).toBe("No deadline");
    expect(deadlineSummary("not-a-date")).toBe("Choose a valid date and time");
  });

  it("adds device-local context without changing the entered wall time", () => {
    expect(
      deadlineSummary("2099-01-01T10:00", {
        locale: "en-IN",
        timeZoneName: "device local time",
      }),
    ).toMatch(/1 Jan 2099, 10:00 am \(device local time\)/i);
  });

  it("distinguishes optional, future, and expired deadlines", () => {
    const now = new Date("2026-08-13T10:00:00.000Z");
    expect(isFutureLocalDeadline("", now)).toBe(true);
    expect(isFutureLocalDeadline("2099-01-01T10:00", now)).toBe(true);
    expect(isFutureLocalDeadline("2020-01-01T10:00", now)).toBe(false);
  });

  it("serializes the teacher's device-local choice as an absolute instant", () => {
    expect(serializeLocalDeadline("")).toBe("");
    expect(new Date(serializeLocalDeadline("2099-01-01T10:00")).valueOf()).toBe(
      new Date("2099-01-01T10:00").valueOf(),
    );
  });
});
