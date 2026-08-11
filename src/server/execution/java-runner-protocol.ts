import { z } from "zod";

export const JAVA_RUNNER_WALL_TIME_MS = 2_000;
export const JAVA_RUNNER_OUTPUT_BYTES = 16_384;
export const JAVA_RUNNER_RESPONSE_BYTES = 131_072;
export const JAVA_RUNNER_SOURCE_BYTES = 262_144;
export const JAVA_RUNNER_TEST_VALUE_BYTES = 65_536;
export const JAVA_RUNNER_MAX_TESTS = 100;

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
