import { z } from "zod";

export const JAVA_RUNNER_WALL_TIME_MS = 2_000;
export const JAVA_RUNNER_COMPILE_TIME_MS = 8_000;
export const JAVA_RUNNER_HTTP_TIMEOUT_MS = 20_000;
export const JAVA_RUNNER_OUTPUT_BYTES = 16_384;
export const JAVA_RUNNER_TOTAL_OUTPUT_BYTES = 65_536;
export const JAVA_RUNNER_RESPONSE_BYTES = 131_072;
export const JAVA_RUNNER_REQUEST_BYTES = 14 * 1_024 * 1_024;
export const JAVA_RUNNER_SOURCE_BYTES = 262_144;
export const JAVA_RUNNER_TEST_VALUE_BYTES = 65_536;
export const JAVA_RUNNER_MAX_TESTS = 100;

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

const runnerTestSchema = z.object({
  id: z.string().min(1).max(200),
  input: z
    .string()
    .refine((value) => byteLength(value) <= JAVA_RUNNER_TEST_VALUE_BYTES, {
      message: "Test input exceeded the configured byte limit.",
    }),
  expectedOutput: z
    .string()
    .refine((value) => byteLength(value) <= JAVA_RUNNER_TEST_VALUE_BYTES, {
      message: "Expected output exceeded the configured byte limit.",
    }),
  visibility: z.enum(["VISIBLE", "HIDDEN"]),
});

export const javaRunnerRequestSchema = z
  .object({
    language: z.literal("JAVA"),
    sourceCode: z
      .string()
      .refine((value) => byteLength(value) <= JAVA_RUNNER_SOURCE_BYTES, {
        message: "Source exceeded the configured byte limit.",
      }),
    tests: z.array(runnerTestSchema).max(JAVA_RUNNER_MAX_TESTS),
    limits: z.object({
      wallTimeMs: z.literal(JAVA_RUNNER_WALL_TIME_MS),
      outputBytes: z.literal(JAVA_RUNNER_OUTPUT_BYTES),
      network: z.literal("none"),
    }),
  })
  .superRefine((value, context) => {
    const seenIds = new Set<string>();
    value.tests.forEach((test, index) => {
      if (seenIds.has(test.id)) {
        context.addIssue({
          code: "custom",
          message: "Test IDs must be unique.",
          path: ["tests", index, "id"],
        });
      }
      seenIds.add(test.id);
    });
  });

export type JavaRunnerRequest = z.infer<typeof javaRunnerRequestSchema>;

const runnerTestResultSchema = z.object({
  testId: z.string().min(1).max(200),
  passed: z.boolean(),
  actualOutput: z.string().max(JAVA_RUNNER_OUTPUT_BYTES),
  visibility: z.enum(["VISIBLE", "HIDDEN"]),
});

export const javaRunnerResponseSchema = z
  .object({
    state: z.enum([
      "completed",
      "compilation_error",
      "runtime_error",
      "time_limit_exceeded",
      "internal_error",
    ]),
    passedTests: z.number().int().nonnegative(),
    totalTests: z.number().int().nonnegative(),
    errorText: z.string().max(JAVA_RUNNER_OUTPUT_BYTES).optional(),
    testResults: z.array(runnerTestResultSchema).max(JAVA_RUNNER_MAX_TESTS),
  })
  .superRefine((value, context) => {
    if (value.passedTests > value.totalTests) {
      context.addIssue({
        code: "custom",
        message: "passedTests cannot exceed totalTests",
        path: ["passedTests"],
      });
    }
  });

export type JavaRunnerResponse = z.infer<typeof javaRunnerResponseSchema>;
