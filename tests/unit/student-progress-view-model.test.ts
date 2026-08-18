import { describe, expect, it } from "vitest";
import type { StudentOverview } from "@/server/student/overview";
import { buildStudentProgressViewModel } from "@/features/student/student-progress-view-model";

type Practical = StudentOverview["practicals"][number];

function practical(overrides: Partial<Practical> = {}): Practical {
  return {
    id: "task-1",
    title: "Array sum",
    instructions: "Add numbers",
    constraints: null,
    allowedLanguages: ["CPP"],
    deadline: "2026-08-20T10:00:00.000Z",
    classroom: { id: "class-1", name: "DSA Lab", subject: "DSA", section: "A" },
    visibleTestCount: 1,
    visibleTests: [{ id: "test-1", input: "2 3", expectedOutput: "5" }],
    latestSession: null,
    latestSubmission: null,
    attempts: [],
    ...overrides,
  };
}

function overview(overrides: Partial<StudentOverview> = {}): StudentOverview {
  const practicals = overrides.practicals ?? [];
  const submissions = overrides.submissions ?? [];
  return {
    classes: [{
      id: "class-1",
      name: "DSA Lab",
      subject: "DSA",
      section: "A",
      practicalCount: practicals.length,
      submittedPracticalCount: practicals.filter((item) => item.latestSubmission).length,
      completionPercentage: 0,
      latestPractical: null,
    }],
    practicals,
    submissions,
    summary: {
      classCount: 1,
      practicalCount: practicals.length,
      submittedPracticalCount: practicals.filter((item) => item.latestSubmission).length,
      completionPercentage: practicals.length
        ? Math.round(practicals.filter((item) => item.latestSubmission).length / practicals.length * 100)
        : 0,
    },
    ...overrides,
  };
}

function submittedData(feedback = false, marks: { awarded: number; outOf: number } | null = null) {
  const latestSubmission = {
    id: "submission-1",
    attemptNumber: 1,
    language: "CPP" as const,
    submittedAt: "2026-08-12T10:00:00.000Z",
    state: "COMPLETED" as const,
    passedTests: 2,
    totalTests: 2,
    feedbackAvailable: feedback,
  };
  return {
    latestSubmission,
    submission: {
      ...latestSubmission,
      visiblePassedTests: 1,
      visibleTotalTests: 1,
      publishedMarks: marks,
      practical: { id: "task-1", title: "Array sum" },
      classroom: { id: "class-1", name: "DSA Lab", subject: "DSA", section: "A" },
    },
  };
}

describe("student progress view model", () => {
  it("distinguishes no classes from no published practicals", () => {
    expect(buildStudentProgressViewModel(overview({ classes: [] })).state).toBe("NO_CLASSES");
    expect(buildStudentProgressViewModel(overview()).state).toBe("NO_PRACTICALS");
  });

  it("reports zero, partial, and complete submission progress without score analytics", () => {
    const first = practical();
    const submitted = submittedData();
    const second = practical({ id: "task-2", title: "Linked list", latestSubmission: submitted.latestSubmission });
    const partial = buildStudentProgressViewModel(overview({ practicals: [first, second], submissions: [submitted.submission] }));
    expect(partial.summary).toEqual({
      submitted: 1,
      total: 2,
      awaiting: 1,
      percentage: 50,
      passedAllProvidedTests: 1,
      publishedReviews: 0,
    });
    expect(partial.allSubmitted).toBe(false);
    expect(JSON.stringify(partial)).not.toContain("suggestedScore");

    const complete = buildStudentProgressViewModel(overview({ practicals: [second], submissions: [submitted.submission] }));
    expect(complete.allSubmitted).toBe(true);
  });

  it("counts a compilation-error attempt as submitted but not as test success", () => {
    const failed = submittedData();
    const failedLatest = {
      ...failed.latestSubmission,
      state: "COMPILATION_ERROR" as const,
      passedTests: 0,
      totalTests: 2,
    };
    const view = buildStudentProgressViewModel(overview({
      practicals: [practical({ latestSubmission: failedLatest })],
      submissions: [{ ...failed.submission, ...failedLatest }],
    }));

    expect(view.summary).toMatchObject({
      submitted: 1,
      passedAllProvidedTests: 0,
    });
    expect(view.classes[0].practicals[0]).toMatchObject({
      workStatusLabel: "Submitted",
      outcomeLabel: "Compilation error",
      passedAllProvidedTests: false,
    });
  });

  it("uses real start, continue, and submission destinations", () => {
    const active = practical({ latestSession: { id: "session-1", status: "ACTIVE", attemptNumber: 1, updatedAt: "2026-08-12T10:00:00.000Z" } });
    const submitted = submittedData();
    const done = practical({ id: "task-2", latestSubmission: submitted.latestSubmission });
    const view = buildStudentProgressViewModel(overview({ practicals: [practical(), active, done], submissions: [submitted.submission] }));
    expect(view.classes[0].practicals.map((item) => [item.actionLabel, item.actionHref])).toEqual([
      ["Start practical", "/tasks/task-1"],
      ["Continue practical", "/tasks/task-1"],
      ["View submission", "/submissions/submission-1"],
    ]);
  });

  it("shows marks and feedback only when a published review is supplied", () => {
    const privateReview = submittedData(false, null);
    const privateView = buildStudentProgressViewModel(overview({
      practicals: [practical({ latestSubmission: privateReview.latestSubmission })],
      submissions: [privateReview.submission],
    }));
    expect(privateView.classes[0].practicals[0]).toMatchObject({
      workStatusLabel: "Submitted",
      outcomeLabel: "Passed all provided tests",
      reviewLabel: "Teacher review pending",
      publishedMarks: null,
    });

    const published = submittedData(true, { awarded: 8, outOf: 10 });
    const publishedView = buildStudentProgressViewModel(overview({
      practicals: [practical({ latestSubmission: published.latestSubmission })],
      submissions: [published.submission],
    }));
    expect(publishedView.classes[0].practicals[0]).toMatchObject({
      workStatusLabel: "Submitted",
      outcomeLabel: "Passed all provided tests",
      reviewLabel: "Feedback available",
      publishedMarks: { awarded: 8, outOf: 10 },
    });
  });

  it("groups practicals by their real classroom context", () => {
    const secondClass = practical({
      id: "task-2",
      classroom: { id: "class-2", name: "OOP Lab", subject: "OOP", section: "B" },
    });
    const view = buildStudentProgressViewModel(overview({
      classes: [
        { id: "class-1", name: "DSA Lab", subject: "DSA", section: "A", practicalCount: 1, submittedPracticalCount: 0, completionPercentage: 0, latestPractical: null },
        { id: "class-2", name: "OOP Lab", subject: "OOP", section: "B", practicalCount: 1, submittedPracticalCount: 0, completionPercentage: 0, latestPractical: null },
      ],
      practicals: [practical(), secondClass],
    }));
    expect(view.classes.map((item) => item.name)).toEqual(["DSA Lab", "OOP Lab"]);
  });
});
