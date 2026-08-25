import type { AttemptProcessAnalysis } from "./integrity-engine";

export type VivaQuestionCategory =
  | "IMPLEMENTATION_CHOICE"
  | "COMPLEXITY_EDGE_CASES"
  | "MODIFICATION_CHALLENGE"
  | "PROCESS_GROUNDED_PROBE";

export interface VivaQuestion {
  id: string;
  category: VivaQuestionCategory;
  title: string;
  question: string;
  expectedAnswerHint: string;
  rubricFocus: string;
}

export interface VivaGenerationResult {
  questions: VivaQuestion[];
  feedbackDraft: string;
  codeInsights: {
    language: "CPP" | "JAVA";
    detectedFunctions: string[];
    detectedDataStructures: string[];
    detectedPatterns: string[];
    estimatedComplexity: string;
  };
  provenance: {
    model: string;
    generatedAt: string;
    groundedInAST: boolean;
  };
}

export interface GenerateVivaInput {
  sourceCode: string;
  language: "CPP" | "JAVA";
  taskTitle: string;
  processAnalysis?: AttemptProcessAnalysis;
  testPassRatio?: { passed: number; total: number };
  topSimilarity?: {
    structuralSimilarityPercentage: number;
    verdict: string;
    variableRenamingDetected: boolean;
    studentBName?: string;
  } | null;
}

/**
 * Lightweight deterministic code parser that extracts functions, data structures,
 * and algorithmic patterns from C++ or Java code.
 */
function analyzeCodeStructure(sourceCode: string, language: "CPP" | "JAVA") {
  const detectedFunctions: string[] = [];
  const detectedDataStructures: string[] = [];
  const detectedPatterns: string[] = [];

  // Data structure detection
  if (language === "CPP") {
    if (/vector\s*</.test(sourceCode)) detectedDataStructures.push("std::vector");
    if (/unordered_map\s*<|map\s*</.test(sourceCode)) detectedDataStructures.push("std::map / hash table");
    if (/unordered_set\s*<|set\s*</.test(sourceCode)) detectedDataStructures.push("std::set");
    if (/stack\s*</.test(sourceCode)) detectedDataStructures.push("std::stack");
    if (/queue\s*<|priority_queue\s*</.test(sourceCode)) detectedDataStructures.push("std::queue / heap");
    if (/struct\s+\w+|class\s+\w+/.test(sourceCode)) detectedDataStructures.push("Custom Struct/Class");
  } else {
    if (/ArrayList\s*<|List\s*</.test(sourceCode)) detectedDataStructures.push("java.util.List / ArrayList");
    if (/HashMap\s*<|Map\s*</.test(sourceCode)) detectedDataStructures.push("java.util.Map / HashMap");
    if (/HashSet\s*<|Set\s*</.test(sourceCode)) detectedDataStructures.push("java.util.Set / HashSet");
    if (/Stack\s*<|Deque\s*</.test(sourceCode)) detectedDataStructures.push("Stack / Deque");
    if (/PriorityQueue\s*</.test(sourceCode)) detectedDataStructures.push("PriorityQueue / Heap");
    if (/new\s+[A-Z]\w*\s*\(/.test(sourceCode)) detectedDataStructures.push("Custom Class Object");
  }

  // Function signature detection
  const functionRegex = language === "CPP"
    ? /(?:void|int|bool|string|double|float|long|auto|char|vector<\w+>)\s+([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{/g
    : /(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{/g;

  let match: RegExpExecArray | null;
  while ((match = functionRegex.exec(sourceCode)) !== null) {
    const fnName = match[1];
    if (fnName && fnName !== "main" && fnName !== "if" && fnName !== "while" && fnName !== "for" && fnName !== "switch") {
      if (!detectedFunctions.includes(fnName)) {
        detectedFunctions.push(fnName);
      }
    }
  }

  // Algorithmic Pattern detection
  if (/for\s*\([^)]*\)\s*\{[^{}]*for\s*\(/.test(sourceCode.replace(/\r?\n/g, " "))) {
    detectedPatterns.push("Nested Iteration (O(N²) structure)");
  } else if (/for\s*\(|while\s*\(/.test(sourceCode)) {
    detectedPatterns.push("Linear Iteration (O(N) structure)");
  }

  if (/\b([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{[\s\S]*?\b\1\s*\(/.test(sourceCode)) {
    detectedPatterns.push("Recursive Call Structure");
  }

  if (/mid\s*=|left\s*<=\s*right|low\s*<=\s*high/.test(sourceCode)) {
    detectedPatterns.push("Binary Search / Divide & Conquer");
  }

  if (/sort\s*\(|Arrays\.sort|Collections\.sort/.test(sourceCode)) {
    detectedPatterns.push("Library Sorting Routine (O(N log N))");
  }

  let estimatedComplexity = "Not reliably inferred";
  if (detectedPatterns.includes("Nested Iteration (O(N²) structure)")) {
    estimatedComplexity = "O(N²) Quadratic Time";
  } else if (detectedPatterns.includes("Library Sorting Routine (O(N log N))")) {
    estimatedComplexity = "O(N log N) Linearithmic Time";
  } else if (detectedPatterns.includes("Binary Search / Divide & Conquer")) {
    estimatedComplexity = "O(log N) Logarithmic Time";
  } else if (detectedPatterns.includes("Linear Iteration (O(N) structure)")) {
    estimatedComplexity = "O(N) Linear Time";
  }

  return {
    detectedFunctions,
    detectedDataStructures,
    detectedPatterns: detectedPatterns.length > 0 ? detectedPatterns : ["Sequential execution"],
    estimatedComplexity,
  };
}

/**
 * Generates viva questions and feedback grounded in the student's submitted code.
 * Follows the 4-question specification in documentation/05-AI-EVIDENCE-SYSTEM.md.
 */
export function generateVivaDefense(input: GenerateVivaInput): VivaGenerationResult {
  const structure = analyzeCodeStructure(input.sourceCode, input.language);
  const primaryFunction = structure.detectedFunctions[0];
  const primaryDataStructure = structure.detectedDataStructures[0];
  const codeLocation = primaryFunction ? `\`${primaryFunction}\`` : "the submitted program";
  const implementationSubject = primaryDataStructure ?? "the variables and control flow shown in the source";

  const questions: VivaQuestion[] = [
    {
      id: "viva-q1-implementation",
      category: "IMPLEMENTATION_CHOICE",
      title: "Implementation Choice & Data Structure",
      question: `In your implementation of ${input.taskTitle}, explain how you used ${implementationSubject} in ${codeLocation}. What alternative approach did you consider?`,
      expectedAnswerHint: `The student should point to the submitted source and explain the trade-offs of ${implementationSubject}.`,
      rubricFocus: "Logic & Design Justification (2–3 marks)",
    },
    {
      id: "viva-q2-complexity",
      category: "COMPLEXITY_EDGE_CASES",
      title: "Time Complexity & Boundary Conditions",
      question: `What is the worst-case time complexity of ${codeLocation}, and how does the submitted code behave if the input is empty or contains extreme boundary values?`,
      expectedAnswerHint: structure.estimatedComplexity === "Not reliably inferred"
        ? "Complexity was not reliably inferred. Ask the student to trace the actual control flow and justify the bound."
        : `Possible complexity signal: ${structure.estimatedComplexity}. Verify it against the submitted control flow before grading.`,
      rubricFocus: "Algorithmic Analysis & Edge Cases (2–3 marks)",
    },
    {
      id: "viva-q3-modification",
      category: "MODIFICATION_CHALLENGE",
      title: "Code Modification / Dry-Run Scenario",
      question: `Choose one branch, loop, or output statement in ${codeLocation}. What specific change would be needed to handle an additional edge case?`,
      expectedAnswerHint: "The student should identify a real line in the submitted source, name an edge case, and explain the exact change without relying on an assumed algorithm.",
      rubricFocus: "Hands-on Code Understanding (2–3 marks)",
    },
  ];

  // Question 4: Process / Authorial Verification Probe
  if (input.topSimilarity && (input.topSimilarity.structuralSimilarityPercentage >= 75 || input.topSimilarity.variableRenamingDetected)) {
    questions.push({
      id: "viva-q4-authorial-probe",
      category: "PROCESS_GROUNDED_PROBE",
      title: "Authorial Verification & Code Defense",
      question: `Explain the exact sequence of state transformations in ${codeLocation}. If you rewrote it without the current variable names, what invariant would you preserve?`,
      expectedAnswerHint: "Student must demonstrate spontaneous, fluent understanding of the underlying logic rather than memorized variable names.",
      rubricFocus: "Authentic Code Authorship (2–3 marks)",
    });
  } else if (input.processAnalysis && input.processAnalysis.draftCount <= 1) {
    questions.push({
      id: "viva-q4-process",
      category: "PROCESS_GROUNDED_PROBE",
      title: "Process & Refactoring Walkthrough",
      question: `Walk me through how you authored ${codeLocation}. Which part is complete, which part still needs work, and why?`,
      expectedAnswerHint: "The student should connect their explanation to the submitted lines and acknowledge incomplete or failing behavior when present.",
      rubricFocus: "Authentic Code Authorship (2 marks)",
    });
  } else {
    questions.push({
      id: "viva-q4-process",
      category: "PROCESS_GROUNDED_PROBE",
      title: "Testing & Debugging Strategy",
      question: `What was the most challenging bug or test case you encountered while running tests for ${input.taskTitle}, and how did you resolve it?`,
      expectedAnswerHint: "Student should describe their iterative debugging steps and test output verification.",
      rubricFocus: "Problem-Solving & Debugging (2 marks)",
    });
  }

  // Constructive Teacher Feedback Draft
  const verification = input.testPassRatio;
  const passRate = verification ? `${verification.passed}/${verification.total}` : "not available";
  const feedbackDraft = verification && verification.total > 0 && verification.passed === 0
    ? `${input.taskTitle}: automated verification did not pass (${passRate} tests). Review compiler or runtime diagnostics before grading. Ask the student to explain the submitted source; no correctness or complexity claim is inferred.`
    : `${input.taskTitle}: automated verification result is ${passRate} tests passed. Review the submitted source and boundary cases before awarding marks. Complexity signal: ${structure.estimatedComplexity}; verify this directly rather than treating it as a grade.`;

  return {
    questions,
    feedbackDraft,
    codeInsights: {
      language: input.language,
      ...structure,
    },
    provenance: {
      model: "Deterministic source heuristic (v1.1)",
      generatedAt: new Date().toISOString(),
      groundedInAST: false,
    },
  };
}
