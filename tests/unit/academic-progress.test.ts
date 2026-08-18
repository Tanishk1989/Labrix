import { describe, expect, it } from "vitest";
import { describeSubmissionOutcome } from "@/domain/submissions/academic-progress";

describe("academic submission progress", () => {
  it("does not equate submission with passing provided tests", () => {
    expect(describeSubmissionOutcome({
      state: "COMPILATION_ERROR",
      passedTests: 0,
      totalTests: 2,
    })).toMatchObject({
      label: "Compilation error",
      passedAllProvidedTests: false,
    });
    expect(describeSubmissionOutcome({
      state: "COMPLETED",
      passedTests: 1,
      totalTests: 2,
    })).toMatchObject({
      label: "1/2 provided tests passed",
      passedAllProvidedTests: false,
    });
  });

  it("uses the required bounded success wording", () => {
    expect(describeSubmissionOutcome({
      state: "COMPLETED",
      passedTests: 2,
      totalTests: 2,
    })).toEqual({
      kind: "PASSED_ALL_PROVIDED_TESTS",
      label: "Passed all provided tests",
      passedAllProvidedTests: true,
    });
  });

  it("keeps testless submissions distinct from test success", () => {
    expect(describeSubmissionOutcome({
      state: "COMPLETED",
      passedTests: 0,
      totalTests: 0,
    })).toMatchObject({
      label: "No provided tests",
      passedAllProvidedTests: false,
    });
  });
});
