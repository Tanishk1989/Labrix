import { z } from "zod";
import type { HintContext } from "./context-builder";
import { verifyNoSolutionLeakage } from "./leakage-guard";

export const SocraticHintOutputSchema = z.object({
  level: z.number().min(1).max(3),
  category: z.enum([
    "conceptual",
    "data-structure",
    "boundary-condition",
    "off-by-one",
    "loop-condition",
    "pointer-state",
    "recursion-base-case",
    "complexity",
    "compiler-error",
    "runtime-error",
    "structural",
  ]),
  hintText: z.string().min(10).max(800),
  nextQuestion: z.string().min(5).max(300),
  focusLines: z.array(z.number()).default([]),
});

export type SocraticHintOutput = z.infer<typeof SocraticHintOutputSchema>;

export interface AiHintProvider {
  generateHint(context: HintContext): Promise<SocraticHintOutput>;
}

/**
 * Deterministic Socratic Hint Synthesizer
 * Grounded in the student's AST structure, compiler errors, and visible test results.
 * Works seamlessly in demo mode and provides robust fallback if external LLM is unreachable.
 */
export class DeterministicSocraticHintProvider implements AiHintProvider {
  async generateHint(context: HintContext): Promise<SocraticHintOutput> {
    const { task, latestRun, failedVisibleTests, requestedLevel } = context;

    // Detect error signals
    const isCompilerError = latestRun?.state === "COMPILATION_ERROR";
    const isRuntimeError = latestRun?.state === "RUNTIME_ERROR" || latestRun?.state === "TIME_LIMIT_EXCEEDED";
    const hasFailedTests = failedVisibleTests.length > 0;

    // LEVEL 1 — Conceptual Nudge
    if (requestedLevel === 1) {
      if (isCompilerError) {
        return {
          level: 1,
          category: "compiler-error",
          hintText: "Your code encountered a syntax or type resolution issue during compilation. Check variable declarations, matching braces, and type compatibility before reasoning about algorithmic flow.",
          nextQuestion: "Does every opening delimiter in your code have a matching closing pair?",
          focusLines: [1, 5],
        };
      }

      if (/bracket|parenthes|stack/i.test(task.title + task.instructions)) {
        return {
          level: 1,
          category: "data-structure",
          hintText: "Consider how opening and closing delimiters interact. When you encounter a closing bracket, what should it match? Think about whether a Last-In, First-Out (LIFO) data structure simplifies this tracking.",
          nextQuestion: "Which data structure lets you immediately check the most recently seen unmatched opening character in O(1) time?",
          focusLines: [3, 8],
        };
      }

      if (/two\s*sum|target|pair|hash/i.test(task.title + task.instructions)) {
        return {
          level: 1,
          category: "conceptual",
          hintText: "Rather than checking every pair with a nested loop in O(N²) time, ask yourself: for any current element `x`, what exact complementary value `target - x` do you need to find?",
          nextQuestion: "What data structure allows you to query whether the needed complement was already visited in O(1) expected time?",
          focusLines: [4, 10],
        };
      }

      return {
        level: 1,
        category: "conceptual",
        hintText: `Reflect on the primary objective of "${task.title}". Identify the core state that must be preserved as you process each element from left to right.`,
        nextQuestion: "What invariant or condition must remain true after each iteration of your main loop?",
        focusLines: [5, 12],
      };
    }

    // LEVEL 2 — Diagnostic / Boundary Hint
    if (requestedLevel === 2) {
      if (isCompilerError && latestRun?.errorText) {
        const firstError = latestRun.errorText.split("\n")[0] || "syntax error";
        return {
          level: 2,
          category: "compiler-error",
          hintText: `The compiler reported: "${firstError.slice(0, 140)}". Check line boundaries and method signatures carefully.`,
          nextQuestion: "Are all referenced types and headers properly imported?",
          focusLines: [2, 6],
        };
      }

      if (isRuntimeError && latestRun?.errorText) {
        return {
          level: 2,
          category: "runtime-error",
          hintText: "Your code encountered a runtime fault or exceeded execution time limits. Inspect memory allocations, recursion depth, and loop termination conditions.",
          nextQuestion: "Is there a base case in your recursion or a valid increment in your loop?",
          focusLines: [1, 10],
        };
      }

      if (hasFailedTests) {
        const firstFail = failedVisibleTests[0];
        return {
          level: 2,
          category: "boundary-condition",
          hintText: `Your logic produced a different outcome on Test Case #${firstFail.position} (Input: "${firstFail.input}"). Inspect whether your loop bounds process the final index or if empty/single-character inputs trigger an unhandled edge condition.`,
          nextQuestion: `What should the function return immediately when the input is empty or of length 1?`,
          focusLines: [8, 14],
        };
      }

      return {
        level: 2,
        category: "loop-condition",
        hintText: "Check your loop termination conditions and array index bounds. Ensure pointer increments or decrements happen on every execution path without early break statements.",
        nextQuestion: "Does your loop index go out of bounds when evaluating the final element?",
        focusLines: [6, 11],
      };
    }

    // LEVEL 3 — Structural Scaffold
    if (requestedLevel === 3) {
      if (/bracket|parenthes|stack/i.test(task.title + task.instructions)) {
        return {
          level: 3,
          category: "structural",
          hintText: "1. Initialize an empty stack of characters.\n2. Iterate through each character in the string.\n3. If it is an opening bracket ('(', '{', '['), push it onto the stack.\n4. If it is a closing bracket, verify the stack is not empty and the top element matches; then pop.\n5. After the loop, return true if and only if the stack is completely empty.",
          nextQuestion: "What happens if a closing bracket appears when the stack is already empty?",
          focusLines: [5, 18],
        };
      }

      if (/two\s*sum|target|pair/i.test(task.title + task.instructions)) {
        return {
          level: 3,
          category: "structural",
          hintText: "1. Create a hash map mapping each value to its array index.\n2. Loop through the array with index `i`.\n3. Calculate `complement = target - nums[i]`.\n4. Check if `complement` exists in your map.\n5. If found, return the pair `[map[complement], i]`; otherwise insert `nums[i] -> i` into your map.",
          nextQuestion: "Why should you insert elements into the map during traversal rather than pre-populating all elements at once?",
          focusLines: [4, 15],
        };
      }

      return {
        level: 3,
        category: "structural",
        hintText: "1. Handle initial boundary guard conditions (e.g. empty or null input).\n2. Initialize your primary accumulator or state structure.\n3. Traverse the input sequentially, applying your state transition invariant at each step.\n4. Ensure termination conditions return the finalized state cleanly.",
        nextQuestion: "Have you verified that all branch paths return a valid result?",
        focusLines: [3, 20],
      };
    }

    throw new Error(`Invalid hint level requested: ${requestedLevel}`);
  }
}

/**
 * Main Socratic Hint Generator with Anti-Solution Leakage Verification
 */
export async function generateSocraticHint(
  context: HintContext,
  provider: AiHintProvider = new DeterministicSocraticHintProvider(),
): Promise<SocraticHintOutput> {
  const rawOutput = await provider.generateHint(context);

  // Validate output shape via Zod
  const parsed = SocraticHintOutputSchema.parse(rawOutput);

  // Validate anti-solution leakage guardrails
  const leakageCheck = verifyNoSolutionLeakage(parsed.hintText, context.requestedLevel);
  if (!leakageCheck.safe) {
    throw new Error(`Hint rejected by anti-solution leakage guard: ${leakageCheck.reason}`);
  }

  return parsed;
}
