export type StarterCodeLanguage = "CPP" | "JAVA";

export type StarterCodeMap = Record<StarterCodeLanguage, string>;

export const DEFAULT_STARTER_CODES: StarterCodeMap = {
  CPP: "#include <iostream>\nusing namespace std;\n\nint main() {\n  // Write your solution here\n  return 0;\n}",
  JAVA: "public class Main {\n  public static void main(String[] args) {\n    // Write your solution here\n  }\n}",
};

export const LEGACY_STARTER_CODES: StarterCodeMap = {
  CPP: "#include <iostream>\nusing namespace std;\n\nint main() {\n  // fail_test — replace this comment with your solution\n  return 0;\n}",
  JAVA: DEFAULT_STARTER_CODES.JAVA,
};

export function resolveStarterCodes(task: {
  cppStarterCode?: string | null;
  javaStarterCode?: string | null;
}): StarterCodeMap {
  return {
    CPP: task.cppStarterCode ?? LEGACY_STARTER_CODES.CPP,
    JAVA: task.javaStarterCode ?? LEGACY_STARTER_CODES.JAVA,
  };
}

export function sourceAfterLanguageChange(input: {
  sourceCode: string;
  currentLanguage: StarterCodeLanguage;
  nextLanguage: StarterCodeLanguage;
  starterCodes: StarterCodeMap;
  canReplaceDefault: boolean;
}) {
  if (
    input.canReplaceDefault &&
    input.sourceCode === input.starterCodes[input.currentLanguage]
  ) {
    return input.starterCodes[input.nextLanguage];
  }
  return input.sourceCode;
}
