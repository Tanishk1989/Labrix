import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StudentRunResults } from "@/features/workspace/student-run-results";

describe("workspace durable execution state", () => {
  it("shows queue position for a durable submission job", () => {
    const markup = renderToStaticMarkup(createElement(StudentRunResults, {
      running: true,
      visibleTests: [],
      progress: {
        id: "job-1",
        kind: "SUBMIT",
        status: "QUEUED",
        queuePosition: 14,
        createdAt: new Date(0).toISOString(),
      },
    }));
    expect(markup).toContain("Submission queued");
    expect(markup).toContain("position 14");
    expect(markup).toContain("safely queued");
  });
});
