import { describe, expect, it } from "vitest";
import {
  DEFAULT_STARTER_CODES,
  LEGACY_STARTER_CODES,
  resolveStarterCodes,
  sourceAfterLanguageChange,
} from "@/domain/tasks/starter-code";

const templates = {
  CPP: "// C++ starter",
  JAVA: "// Java starter",
};

describe("practical starter code", () => {
  it("keeps legacy practicals readable with built-in defaults", () => {
    expect(resolveStarterCodes({})).toEqual(LEGACY_STARTER_CODES);
    expect(DEFAULT_STARTER_CODES.CPP).not.toContain("fail_test");
  });

  it("selects the matching language template while the draft is untouched", () => {
    expect(
      sourceAfterLanguageChange({
        sourceCode: templates.CPP,
        currentLanguage: "CPP",
        nextLanguage: "JAVA",
        starterCodes: templates,
        canReplaceDefault: true,
      }),
    ).toBe(templates.JAVA);
  });

  it("does not replace edited or previously persisted draft source", () => {
    expect(
      sourceAfterLanguageChange({
        sourceCode: "// student edit",
        currentLanguage: "CPP",
        nextLanguage: "JAVA",
        starterCodes: templates,
        canReplaceDefault: true,
      }),
    ).toBe("// student edit");
    expect(
      sourceAfterLanguageChange({
        sourceCode: templates.CPP,
        currentLanguage: "CPP",
        nextLanguage: "JAVA",
        starterCodes: templates,
        canReplaceDefault: false,
      }),
    ).toBe(templates.CPP);
  });
});
