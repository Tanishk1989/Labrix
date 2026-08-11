import { z } from "zod";

export const CPP_RUNNER_WALL_TIME_MS = 2_000;
export const CPP_RUNNER_COMPILE_TIME_MS = 10_000;
export const CPP_RUNNER_HTTP_TIMEOUT_MS = 22_000;
export const CPP_RUNNER_OUTPUT_BYTES = 16_384;
export const CPP_RUNNER_TOTAL_OUTPUT_BYTES = 65_536;
export const CPP_RUNNER_RESPONSE_BYTES = 131_072;
export const CPP_RUNNER_REQUEST_BYTES = 14 * 1_024 * 1_024;
export const CPP_RUNNER_SOURCE_BYTES = 262_144;
export const CPP_RUNNER_TEST_VALUE_BYTES = 65_536;
export const CPP_RUNNER_MAX_TESTS = 100;

function byteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

const cppRunnerTestSchema = z.object({
  id: z.string().min(1).max(200),
  input: z
    .string()
    .refine((value) => byteLength(value) <= CPP_RUNNER_TEST_VALUE_BYTES, {
      message: "Test input exceeded the configured byte limit.",
    }),
  expectedOutput: z
    .string()
    .refine((value) => byteLength(value) <= CPP_RUNNER_TEST_VALUE_BYTES, {
      message: "Expected output exceeded the configured byte limit.",
    }),
  visibility: z.enum(["VISIBLE", "HIDDEN"]),
});

export const cppRunnerRequestSchema = z
  .object({
    language: z.literal("CPP"),
    sourceCode: z
      .string()
      .refine((value) => byteLength(value) <= CPP_RUNNER_SOURCE_BYTES, {
        message: "Source exceeded the configured byte limit.",
      }),
    tests: z.array(cppRunnerTestSchema).max(CPP_RUNNER_MAX_TESTS),
    limits: z.object({
      wallTimeMs: z.literal(CPP_RUNNER_WALL_TIME_MS),
      outputBytes: z.literal(CPP_RUNNER_OUTPUT_BYTES),
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

const cppRunnerTestResultSchema = z.object({
  testId: z.string().min(1).max(200),
  passed: z.boolean(),
  actualOutput: z.string().max(CPP_RUNNER_OUTPUT_BYTES),
  visibility: z.enum(["VISIBLE", "HIDDEN"]),
});

export const cppRunnerResponseSchema = z
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
    errorText: z.string().max(CPP_RUNNER_OUTPUT_BYTES).optional(),
    testResults: z.array(cppRunnerTestResultSchema).max(CPP_RUNNER_MAX_TESTS),
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

export type CppRunnerRequest = z.infer<typeof cppRunnerRequestSchema>;
export type CppRunnerResponse = z.infer<typeof cppRunnerResponseSchema>;
