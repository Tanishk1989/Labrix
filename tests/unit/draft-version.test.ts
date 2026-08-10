import { describe, expect, it } from "vitest";
import { draftVersionChanged } from "@/features/workspace/draft-version";

describe("workspace draft version", () => {
  const hydrated = {
    sourceCode: "int main() { return 0; }",
    language: "CPP" as const,
  };

  it("does not autosave initial programmatic hydration", () => {
    expect(draftVersionChanged(hydrated, { ...hydrated })).toBe(false);
  });

  it("requests autosave for an actual source edit", () => {
    expect(
      draftVersionChanged(hydrated, {
        ...hydrated,
        sourceCode: `${hydrated.sourceCode}\n// student edit`,
      }),
    ).toBe(true);
  });

  it("does not autosave a successfully persisted version again", () => {
    const persistedEdit = {
      ...hydrated,
      sourceCode: `${hydrated.sourceCode}\n// persisted edit`,
    };
    expect(draftVersionChanged(persistedEdit, { ...persistedEdit })).toBe(false);
  });

  it("requests autosave for a later different edit", () => {
    expect(
      draftVersionChanged(hydrated, { ...hydrated, language: "JAVA" }),
    ).toBe(true);
  });
});
