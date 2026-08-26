import "server-only";

import {
  generateVivaDefense,
  type GenerateVivaInput,
  type VivaGenerationResult,
} from "./viva-generator";
import { computeSourceCodeHash, logAiGeneration } from "./ai-audit";
import { logEvent } from "@/server/observability/logger";
import { globalRateLimiter } from "@/server/security/rate-limiter";
import { RATE_LIMIT_CONFIGS } from "@/server/security/rate-limit-configs";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_AI_REVIEW_MODEL || "openai/gpt-oss-20b";
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const AI_CACHE = new Map<string, { result: VivaGenerationResult; expiresAt: number }>();

function buildPrompt(input: GenerateVivaInput): string {
  const isAnomalous =
    (input.processAnalysis && input.processAnalysis.draftCount <= 1) ||
    (input.topSimilarity &&
      (input.topSimilarity.structuralSimilarityPercentage >= 75 ||
        input.topSimilarity.variableRenamingDetected));

  return `You are the AI Academic Integrity & Viva Defense Assistant for TRACE.
Analyze the following student's submitted code and generate structured oral defense questions and constructive teacher feedback.

TASK: "${input.taskTitle}"
LANGUAGE: ${input.language}
ACTIVE CODING DURATION: ${input.processAnalysis?.durationFormatted ?? "Unknown"}
DRAFT CHECKPOINTS: ${input.processAnalysis?.draftCount ?? 0}
TEST RUNS: ${input.processAnalysis?.runCount ?? 0}
TEST PASS RATE: ${input.testPassRatio ? `${input.testPassRatio.passed}/${input.testPassRatio.total}` : "Passed"}
STRUCTURAL SIMILARITY / PEER MATCH: ${
    input.topSimilarity
      ? `${input.topSimilarity.structuralSimilarityPercentage}% (${input.topSimilarity.verdict}) - Variable renaming: ${input.topSimilarity.variableRenamingDetected}`
      : "None (Authentic divergence)"
  }

STUDENT SOURCE CODE:
\`\`\`${input.language.toLowerCase()}
${input.sourceCode}
\`\`\`

GUIDELINES & POLICY (STRICT):
1. Adhere to neutral, non-accusatory language. Never accuse of cheating or dishonesty.
2. Ground all questions directly in specific functions, variables, data structures, and algorithmic loops in the code.
3. Question 1: IMPLEMENTATION_CHOICE - Explain why specific data structures or container types were chosen.
4. Question 2: COMPLEXITY_EDGE_CASES - Worst-case time/space complexity & boundary edge inputs (empty, large, negatives).
5. Question 3: MODIFICATION_CHALLENGE - How to alter specific lines for a modified requirement (e.g. reverse order, deduplication).
6. Question 4: PROCESS_GROUNDED_PROBE - ${
    isAnomalous
      ? "Ask the student to explain the state transformations and authorial invariants live without relying on variable names (Authorial Verification)."
      : "Ask the student about their debugging strategy or test case handling."
  }
7. Provide a concise constructive teacher feedback draft.

Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "id": "viva-q1-implementation",
      "category": "IMPLEMENTATION_CHOICE",
      "title": "...",
      "question": "...",
      "expectedAnswerHint": "...",
      "rubricFocus": "..."
    },
    {
      "id": "viva-q2-complexity",
      "category": "COMPLEXITY_EDGE_CASES",
      "title": "...",
      "question": "...",
      "expectedAnswerHint": "...",
      "rubricFocus": "..."
    },
    {
      "id": "viva-q3-modification",
      "category": "MODIFICATION_CHALLENGE",
      "title": "...",
      "question": "...",
      "expectedAnswerHint": "...",
      "rubricFocus": "..."
    },
    {
      "id": "viva-q4-process",
      "category": "PROCESS_GROUNDED_PROBE",
      "title": "...",
      "question": "...",
      "expectedAnswerHint": "...",
      "rubricFocus": "..."
    }
  ],
  "feedbackDraft": "...",
  "codeInsights": {
    "detectedFunctions": ["..."],
    "detectedDataStructures": ["..."],
    "detectedPatterns": ["..."],
    "estimatedComplexity": "..."
  }
}`;
}

async function callGroqAI(
  prompt: string,
  input: GenerateVivaInput,
): Promise<VivaGenerationResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logEvent("warn", "ai_provider_http_error", { provider: "groq", status: response.status });
      return null;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) return null;

    const parsed = JSON.parse(rawContent);
    return {
      questions: parsed.questions,
      feedbackDraft: parsed.feedbackDraft,
      codeInsights: {
        language: input.language,
        detectedFunctions: parsed.codeInsights?.detectedFunctions ?? ["main"],
        detectedDataStructures:
          parsed.codeInsights?.detectedDataStructures ?? ["Variables"],
        detectedPatterns:
          parsed.codeInsights?.detectedPatterns ?? ["Iteration"],
        estimatedComplexity:
          parsed.codeInsights?.estimatedComplexity ?? "O(N) Linear Time",
      },
      provenance: {
        model: `Groq (${GROQ_MODEL})`,
        generatedAt: new Date().toISOString(),
        groundedInAST: true,
      },
    };
  } catch (err) {
    clearTimeout(timeoutId);
    logEvent("warn", "ai_provider_request_failed", {
      provider: "groq",
      errorName: err instanceof Error ? err.name : "UnknownError",
    });
    return null;
  }
}

async function callGeminiAI(
  prompt: string,
  input: GenerateVivaInput,
): Promise<VivaGenerationResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logEvent("warn", "ai_provider_http_error", { provider: "gemini", status: response.status });
      return null;
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    return {
      questions: parsed.questions,
      feedbackDraft: parsed.feedbackDraft,
      codeInsights: {
        language: input.language,
        detectedFunctions: parsed.codeInsights?.detectedFunctions ?? ["main"],
        detectedDataStructures:
          parsed.codeInsights?.detectedDataStructures ?? ["Variables"],
        detectedPatterns:
          parsed.codeInsights?.detectedPatterns ?? ["Iteration"],
        estimatedComplexity:
          parsed.codeInsights?.estimatedComplexity ?? "O(N) Linear Time",
      },
      provenance: {
        model: "Google Gemini 1.5 Flash",
        generatedAt: new Date().toISOString(),
        groundedInAST: true,
      },
    };
  } catch (err) {
    clearTimeout(timeoutId);
    logEvent("warn", "ai_provider_request_failed", {
      provider: "gemini",
      errorName: err instanceof Error ? err.name : "UnknownError",
    });
    return null;
  }
}

export interface ExplicitAiRequestOptions {
  teacherId?: string;
  submissionAttemptId?: string;
  allowAiAssistance?: boolean;
}

/**
 * Generates viva oral defense questions and constructive teacher feedback.
 * When requested explicitly by a teacher, supports Groq/Gemini with
 * caching, audit logging, rate limiting, and zero-downtime deterministic fallback.
 */
export async function generateVivaDefenseWithAI(
  input: GenerateVivaInput,
  options: ExplicitAiRequestOptions = {},
): Promise<VivaGenerationResult> {
  const startTime = Date.now();
  const codeHash = computeSourceCodeHash(input.sourceCode);
  const cacheKey = `${codeHash}:${input.language}:${input.taskTitle}`;

  // 1. Check in-memory cache
  const cached = AI_CACHE.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    if (options.teacherId) {
      await logAiGeneration({
        teacherId: options.teacherId,
        submissionAttemptId: options.submissionAttemptId,
        kind: "VIVA_DEFENSE",
        modelUsed: cached.result.provenance.model,
        sourceCode: input.sourceCode,
        promptTokenEstimate: Math.ceil(input.sourceCode.length / 4),
        cachedResult: true,
        durationMs: Date.now() - startTime,
        status: "SUCCESS",
      });
    }
    return cached.result;
  }

  // 2. Check if AI assistance is blocked by classroom/institutional policy
  if (options.allowAiAssistance === false) {
    return generateVivaDefense(input);
  }

  // 3. Check teacher AI rate limiting if teacherId is provided
  if (options.teacherId) {
    const rl = await globalRateLimiter.check(options.teacherId, RATE_LIMIT_CONFIGS.AI_GENERATION);
    if (!rl.success) {
      return generateVivaDefense(input);
    }
  }

  const prompt = buildPrompt(input);
  let result: VivaGenerationResult | null = null;
  let modelUsed = "Deterministic AST Engine";

  // Try Groq
  if (GROQ_API_KEY) {
    result = await callGroqAI(prompt, input);
    if (result) modelUsed = `Groq (${GROQ_MODEL})`;
  }

  // Try Gemini if Groq failed or unconfigured
  if (!result && GEMINI_API_KEY) {
    result = await callGeminiAI(prompt, input);
    if (result) modelUsed = "Google Gemini 1.5 Flash";
  }

  // Fall back to deterministic AST parser
  if (!result) {
    result = generateVivaDefense(input);
  } else {
    // Cache valid AI result for 1 hour
    AI_CACHE.set(cacheKey, {
      result,
      expiresAt: Date.now() + 3_600_000,
    });
  }

  // Audit log the generation
  if (options.teacherId) {
    await logAiGeneration({
      teacherId: options.teacherId,
      submissionAttemptId: options.submissionAttemptId,
      kind: "VIVA_DEFENSE",
      modelUsed,
      sourceCode: input.sourceCode,
      promptTokenEstimate: Math.ceil(input.sourceCode.length / 4),
      cachedResult: false,
      durationMs: Date.now() - startTime,
      status: "SUCCESS",
    });
  }

  return result;
}
