import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function repositoryFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("teacher attention groups UI boundary", () => {
  it("renders only from the owner-authorized teacher practical analytics route", () => {
    const page = repositoryFile(
      "src/app/classes/[classroomId]/students/page.tsx",
    );
    const service = repositoryFile("src/server/teacher/practical-analytics.ts");

    expect(page).toContain('requiredRole: "TEACHER"');
    expect(page).toContain("<TeacherAttentionGroups groups={analytics.groups}");
    expect(service).toContain("requireOwnedClassroom(prisma, teacherId, classroomId)");
    expect(service).toContain('status: "PUBLISHED"');
  });

  it("uses neutral deterministic wording and no AI action", () => {
    const component = repositoryFile(
      "src/features/classes/teacher-attention-groups.tsx",
    );

    expect(component).toContain("Top verified performers");
    expect(component).toContain("Needs attention");
    expect(component.toLowerCase()).toContain("review priority");
    expect(component).toContain("Not an AI ranking");
    expect(component).not.toContain("generateAI");
    expect(component.toLowerCase()).not.toContain("best students");
    expect(component.toLowerCase()).not.toContain("worst students");
    expect(component.toLowerCase()).not.toContain("cheating");
  });

  it("renders hidden aggregate counters only, never hidden test details", () => {
    const component = repositoryFile(
      "src/features/classes/teacher-attention-groups.tsx",
    );

    expect(component).toContain("Hidden aggregate");
    for (const forbidden of [
      "testId",
      "expectedOutput",
      "actualOutput",
      "sourceCode",
      "hiddenTests",
    ]) {
      expect(component).not.toContain(forbidden);
    }
  });

  it("keeps student UI modules free of deterministic group DTOs", () => {
    for (const path of [
      "src/features/student/student-pages.tsx",
      "src/features/student/submission-result.tsx",
      "src/app/progress/page.tsx",
    ]) {
      const source = repositoryFile(path);
      expect(source).not.toContain("TeacherAttentionGroups");
      expect(source).not.toContain("teacher-attention-groups");
      expect(source).not.toContain("topVerifiedPerformers");
    }
  });
});
