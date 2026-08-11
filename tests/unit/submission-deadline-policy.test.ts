import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SubmissionTimingBadge } from "@/components/submission-timing-badge";
import {
  evaluateSubmissionDeadline,
  submissionTimingLabel,
} from "@/domain/submissions/deadline-policy";

describe("submission deadline policy", () => {
  it("allows a submission with no deadline as on time", () => {
    expect(evaluateSubmissionDeadline({
      deadline: null,
      submittedAt: new Date("2026-08-11T12:00:00.000Z"),
    })).toEqual({ allowed: true, timingStatus: "ON_TIME" });
  });

  it("marks submissions before and exactly at the deadline on time", () => {
    const deadline = new Date("2026-08-11T12:00:00.000Z");
    expect(evaluateSubmissionDeadline({
      deadline,
      submittedAt: new Date("2026-08-11T11:59:59.999Z"),
    }).timingStatus).toBe("ON_TIME");
    expect(evaluateSubmissionDeadline({ submittedAt: deadline, deadline }).timingStatus).toBe("ON_TIME");
  });

  it("allows but marks a submission after the deadline late by default", () => {
    expect(evaluateSubmissionDeadline({
      deadline: new Date("2026-08-11T12:00:00.000Z"),
      submittedAt: new Date("2026-08-11T12:00:00.001Z"),
    })).toEqual({ allowed: true, timingStatus: "LATE" });
  });

  it("can block late submissions without changing timing classification", () => {
    expect(evaluateSubmissionDeadline({
      deadline: new Date("2026-08-11T12:00:00.000Z"),
      submittedAt: new Date("2026-08-11T12:00:01.000Z"),
      policy: "BLOCK_LATE",
    })).toEqual({ allowed: false, timingStatus: "LATE" });
  });

  it("compares instants safely across timezone offsets", () => {
    expect(evaluateSubmissionDeadline({
      deadline: new Date("2026-08-11T17:30:00+05:30"),
      submittedAt: new Date("2026-08-11T12:00:00.001Z"),
    }).timingStatus).toBe("LATE");
  });
});

describe("submission timing display", () => {
  it.each([
    ["ON_TIME", "On time"],
    ["LATE", "Late"],
    [null, "Timing unavailable"],
  ] as const)("renders %s safely", (status, label) => {
    const markup = renderToStaticMarkup(createElement(SubmissionTimingBadge, { status }));
    expect(submissionTimingLabel(status)).toBe(label);
    expect(markup).toContain(label);
    expect(markup).not.toContain("hidden");
  });
});
