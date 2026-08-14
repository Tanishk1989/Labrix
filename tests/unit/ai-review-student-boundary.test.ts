import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function repositoryFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function between(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

const forbiddenStudentAIReferences = [
  "AIReviewBrief",
  "ai-review-brief",
  "generateAIReviewBrief",
  "evidenceFacts",
  "integritySignal",
] as const;

describe("student AI review boundary", () => {
  it("keeps AI brief data out of the student submission DTO", () => {
    const attemptService = repositoryFile("src/server/attempts/service.ts");
    const studentSubmissionFunction = between(
      attemptService,
      "export async function getSubmissionForStudent(",
      "export async function getTeacherClassroomProgress(",
    );

    for (const forbidden of forbiddenStudentAIReferences) {
      expect(studentSubmissionFunction).not.toContain(forbidden);
    }
  });

  it("keeps the student render branch and component AI-free", () => {
    const submissionPage = repositoryFile(
      "src/app/submissions/[submissionId]/page.tsx",
    );
    const studentBranch = between(
      submissionPage,
      'if (actor.role === "STUDENT")',
      "const [review, overview]",
    );
    const studentComponent = repositoryFile(
      "src/features/student/submission-result.tsx",
    );

    for (const forbidden of forbiddenStudentAIReferences) {
      expect(studentBranch).not.toContain(forbidden);
      expect(studentComponent).not.toContain(forbidden);
    }
  });
});
