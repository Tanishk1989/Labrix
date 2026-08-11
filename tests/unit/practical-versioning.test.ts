import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PracticalVersionLabel } from "@/components/practical-version-label";
import {
  nextPracticalVersion,
  practicalVersionForSubmission,
  practicalVersionLabel,
  versionedPracticalContentChanged,
  type VersionedPracticalContent,
} from "@/domain/practicals/versioning";

const content: VersionedPracticalContent = {
  instructions: "Solve the problem.",
  constraints: "n >= 0",
  allowedLanguages: ["CPP", "JAVA"],
  cppStarterCode: "int main() {}",
  javaStarterCode: "class Main {}",
  deadline: new Date("2026-08-20T12:00:00.000Z"),
};

describe("practical versioning", () => {
  it("starts a new practical at version one", () => {
    expect(nextPracticalVersion({
      currentVersion: null,
      isPublished: false,
      contentChanged: true,
    })).toBe(1);
  });

  it("increments a published practical for every versioned content category", () => {
    const changes: VersionedPracticalContent[] = [
      { ...content, instructions: "Updated instructions" },
      { ...content, constraints: null },
      { ...content, allowedLanguages: ["CPP"] },
      { ...content, cppStarterCode: "// updated" },
      { ...content, javaStarterCode: "// updated" },
      { ...content, deadline: new Date("2026-08-21T12:00:00.000Z") },
    ];

    for (const requested of changes) {
      const changed = versionedPracticalContentChanged(content, requested, false);
      expect(nextPracticalVersion({
        currentVersion: 3,
        isPublished: true,
        contentChanged: changed,
      })).toBe(4);
    }

    expect(nextPracticalVersion({
      currentVersion: 3,
      isPublished: true,
      contentChanged: versionedPracticalContentChanged(content, content, true),
    })).toBe(4);
  });

  it("does not increment a no-op published edit", () => {
    expect(versionedPracticalContentChanged(
      content,
      { ...content, allowedLanguages: ["JAVA", "CPP"] },
      false,
    )).toBe(false);
    expect(nextPracticalVersion({
      currentVersion: 2,
      isPublished: true,
      contentChanged: false,
    })).toBe(2);
  });

  it("does not increment while editing or first publishing a draft", () => {
    expect(nextPracticalVersion({
      currentVersion: 1,
      isPublished: false,
      contentChanged: true,
    })).toBe(1);
  });

  it("stores the current positive task version on a new submission", () => {
    expect(practicalVersionForSubmission(7)).toBe(7);
    expect(() => practicalVersionForSubmission(0)).toThrow(
      "Practical version must be a positive integer.",
    );
  });
});

describe("practical version display", () => {
  it.each([
    [4, "Submitted against version 4"],
    [null, "Version unavailable"],
  ] as const)("renders version %s for student and teacher surfaces", (version, label) => {
    const studentMarkup = renderToStaticMarkup(
      createElement(PracticalVersionLabel, { version }),
    );
    const teacherMarkup = renderToStaticMarkup(
      createElement(PracticalVersionLabel, { version }),
    );

    expect(practicalVersionLabel(version)).toBe(label);
    expect(studentMarkup).toContain(label);
    expect(teacherMarkup).toContain(label);
    expect(studentMarkup).not.toContain("hidden");
  });
});
