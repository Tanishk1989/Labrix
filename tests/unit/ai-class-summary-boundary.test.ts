import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function repositoryFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("AI class summary UI boundary", () => {
  it("is mounted only on a teacher-role page", () => {
    const page = repositoryFile(
      "src/app/classes/[classroomId]/students/page.tsx",
    );
    expect(page).toContain('requiredRole: "TEACHER"');
    expect(page).toContain("AIClassSummaryPanel");
  });

  it("generates only from an explicit form submission", () => {
    const panel = repositoryFile(
      "src/features/classes/ai-class-summary.tsx",
    );
    expect(panel).toContain("<form action={formAction}");
    expect(panel).toContain('type="submit"');
    expect(panel).not.toContain("useEffect");
    expect(panel).not.toContain("setInterval");
  });

  it("keeps student pages free of class summary DTOs and actions", () => {
    for (const path of [
      "src/features/student/student-pages.tsx",
      "src/features/student/submission-result.tsx",
      "src/app/progress/page.tsx",
    ]) {
      const source = repositoryFile(path);
      expect(source).not.toContain("AIClassSummary");
      expect(source).not.toContain("ai-class-summary");
      expect(source).not.toContain("generateAIClassSummary");
    }
  });
});
