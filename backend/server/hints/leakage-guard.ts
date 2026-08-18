export interface LeakageCheckResult {
  safe: boolean;
  reason?: string;
}

/**
 * Validates that an AI-generated Socratic hint adheres to its tier contract
 * and does NOT leak compilable source code or full copy-paste solutions.
 */
export function verifyNoSolutionLeakage(
  hintText: string,
  level: number,
): LeakageCheckResult {
  if (!hintText || hintText.trim().length === 0) {
    return { safe: false, reason: "Hint text is empty." };
  }

  const text = hintText.trim();

  // 1. Compilable Boilerplate Pattern Detector
  const compilableBoilerplateRegex =
    /(?:int\s+main\s*\(|public\s+static\s+void\s+main|class\s+\w+\s*\{|#include\s*<|import\s+java\.)/i;
  if (compilableBoilerplateRegex.test(text)) {
    return {
      safe: false,
      reason: "Response contains compilable file/class/main boilerplate.",
    };
  }

  // 2. Level 1 Contract: Conceptual Nudge
  if (level === 1) {
    // Level 1 forbids markdown code fences and full syntax fragments
    if (/```[\s\S]*?```/.test(text)) {
      return {
        safe: false,
        reason: "Level 1 hint cannot contain code fences.",
      };
    }
    if (/(?:for\s*\(|while\s*\(|if\s*\(.*?\)\s*\{|return\s+[^;]+;)/i.test(text)) {
      return {
        safe: false,
        reason: "Level 1 hint cannot contain concrete statement syntax.",
      };
    }
  }

  // 3. Level 2 Contract: Diagnostic / Boundary Hint
  if (level === 2) {
    // Level 2 forbids complete function implementations or multi-line code fences
    const codeFenceMatch = text.match(/```(?:cpp|java|c)?\s*([\s\S]*?)```/i);
    if (codeFenceMatch) {
      const codeInside = codeFenceMatch[1].trim();
      const lineCount = codeInside.split("\n").length;
      if (lineCount > 3) {
        return {
          safe: false,
          reason: "Level 2 hint cannot contain multi-line code blocks (>3 lines).",
        };
      }
    }
    // Reject full function definitions
    if (/(?:bool|int|void|string|vector)\s+\w+\s*\([^)]*\)\s*\{[\s\S]{30,}\}/i.test(text)) {
      return {
        safe: false,
        reason: "Level 2 hint cannot contain complete function definitions.",
      };
    }
  }

  // 4. Level 3 Contract: Structural Scaffold
  if (level === 3) {
    // Level 3 allows numbered pseudo-structure (e.g. 1. Track seen, 2. Compute difference)
    // but forbids compilable full function bodies.
    if (/(?:int|void|bool|char)\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?return\s+[^;]+;\s*\}/i.test(text)) {
      return {
        safe: false,
        reason: "Level 3 scaffold cannot contain a complete compilable function with return statement.",
      };
    }
  }

  return { safe: true };
}
