import "server-only";

import { diagnosticsTokenConfigured } from "@/server/observability/runtime-diagnostics";

export interface EnvValidationResult {
  isValid: boolean;
  mode: "demo" | "clerk";
  missingRequired: string[];
  warnings: string[];
  features: {
    groqAiEnabled: boolean;
    geminiAiEnabled: boolean;
    upstashRateLimiting: boolean;
    runnerConfigured: boolean;
    diagnosticsEnabled: boolean;
  };
}

/**
 * Validates the runtime environment for TRACE.
 * Enforces production security invariants while maintaining smooth development defaults.
 */
export function validateEnvironment(): EnvValidationResult {
  const configuredIdentityMode = process.env.LABRIX_IDENTITY_MODE;
  const mode = configuredIdentityMode === "clerk" ? "clerk" : "demo";
  const isProduction = process.env.NODE_ENV === "production";
  const isSupervisedLocalDemo =
    isProduction &&
    mode === "demo" &&
    process.env.LABRIX_ALLOW_DEMO_IDENTITY_IN_PRODUCTION_BUILD === "true" &&
    process.env.NEXT_PUBLIC_LABRIX_DEMO_RUNTIME === "local-real";
  const missingRequired: string[] = [];
  const warnings: string[] = [];
  const diagnosticsEnabled = diagnosticsTokenConfigured();

  // 1. Database URL
  if (!process.env.DATABASE_URL) {
    missingRequired.push("DATABASE_URL");
  }
  if (configuredIdentityMode !== "demo" && configuredIdentityMode !== "clerk") {
    if (isProduction) missingRequired.push("LABRIX_IDENTITY_MODE=clerk");
    else warnings.push("LABRIX_IDENTITY_MODE must be explicitly set to 'demo' or 'clerk'.");
  }

  // 2. Authentication Validation
  if (mode === "clerk") {
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      missingRequired.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
    }
    if (!process.env.CLERK_SECRET_KEY) {
      missingRequired.push("CLERK_SECRET_KEY");
    }
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      if (isProduction) missingRequired.push("CLERK_WEBHOOK_SECRET");
      else warnings.push("CLERK_WEBHOOK_SECRET is not set. Clerk webhook requests will be rejected.");
    }
  } else if (isProduction && !isSupervisedLocalDemo) {
    missingRequired.push("LABRIX_IDENTITY_MODE=clerk");
  }

  // 3. AI Providers
  const groqAiEnabled = Boolean(process.env.GROQ_API_KEY);
  const geminiAiEnabled = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  if (!groqAiEnabled && !geminiAiEnabled) {
    warnings.push("No AI API keys configured (GROQ_API_KEY or GEMINI_API_KEY). Using deterministic source-based oral-defense prompts.");
  }

  // 4. Rate Limiting
  const upstashRestUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const upstashRestToken =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const upstashRateLimiting = Boolean(upstashRestUrl && upstashRestToken);
  if (isProduction && !isSupervisedLocalDemo && !upstashRateLimiting) {
    if (!upstashRestUrl) {
      missingRequired.push("UPSTASH_REDIS_REST_URL or KV_REST_API_URL");
    }
    if (!upstashRestToken) {
      missingRequired.push("UPSTASH_REDIS_REST_TOKEN or KV_REST_API_TOKEN");
    }
  }
  if (isSupervisedLocalDemo && !upstashRateLimiting) {
    warnings.push("Shared rate limiting is not configured for this supervised single-host demo.");
  }
  if (isProduction && !isSupervisedLocalDemo && !diagnosticsEnabled) {
    warnings.push("Private runtime diagnostics are disabled. Configure TRACE_DIAGNOSTICS_TOKEN with at least 32 characters.");
  }

  // 5. Runner Configuration
  const configuredExecutionProvider = process.env.LABRIX_EXECUTION_PROVIDER;
  const judge0Configured = configuredExecutionProvider === "judge0";
  const wandboxConfigured = configuredExecutionProvider === "wandbox";
  if (isProduction && !isSupervisedLocalDemo &&
      process.env.LABRIX_EXECUTION_DISPATCH !== (judge0Configured || wandboxConfigured ? "inline" : "queued")) {
    missingRequired.push(judge0Configured || wandboxConfigured
      ? "LABRIX_EXECUTION_DISPATCH=inline"
      : "LABRIX_EXECUTION_DISPATCH=queued");
  }
  const supportedExecutionProvider = isProduction
    ? configuredExecutionProvider === "remote-docker" ||
      configuredExecutionProvider === "judge0" ||
      configuredExecutionProvider === "wandbox" ||
      (isSupervisedLocalDemo && configuredExecutionProvider === "local-docker")
    : ["local-docker", "remote-docker", "judge0", "wandbox"].includes(configuredExecutionProvider ?? "");
  const runnerConfigured = wandboxConfigured
    ? supportedExecutionProvider
    : judge0Configured
    ? supportedExecutionProvider && Boolean(process.env.JUDGE0_API_URL) &&
      Boolean(process.env.JUDGE0_API_KEY || process.env.JUDGE0_AUTH_TOKEN)
    : supportedExecutionProvider &&
      Boolean(process.env.LABRIX_JAVA_RUNNER_URL) &&
      Boolean(process.env.LABRIX_CPP_RUNNER_URL) &&
      (configuredExecutionProvider !== "remote-docker" ||
        (process.env.LABRIX_RUNNER_BEARER_TOKEN?.length ?? 0) >= 32);

  if (!runnerConfigured) {
    if (isProduction) {
      const requiredNames = wandboxConfigured
        ? []
        : judge0Configured
        ? ["JUDGE0_API_URL"]
        : ["LABRIX_EXECUTION_PROVIDER", "LABRIX_JAVA_RUNNER_URL", "LABRIX_CPP_RUNNER_URL"];
      for (const name of requiredNames) {
        if (!process.env[name]) missingRequired.push(name);
      }
      if (judge0Configured && !process.env.JUDGE0_API_KEY && !process.env.JUDGE0_AUTH_TOKEN) {
        missingRequired.push("JUDGE0_API_KEY or JUDGE0_AUTH_TOKEN");
      }
      if (!supportedExecutionProvider && configuredExecutionProvider) {
        missingRequired.push("LABRIX_EXECUTION_PROVIDER=remote-docker, judge0, or wandbox");
      }
      if (configuredExecutionProvider === "remote-docker" &&
        (process.env.LABRIX_RUNNER_BEARER_TOKEN?.length ?? 0) < 32) {
        missingRequired.push("LABRIX_RUNNER_BEARER_TOKEN (minimum 32 characters)");
      }
    } else {
      warnings.push("Real Java and C++ execution runners are not fully configured.");
    }
  }

  return {
    isValid: missingRequired.length === 0,
    mode,
    missingRequired,
    warnings,
    features: {
      groqAiEnabled,
      geminiAiEnabled,
      upstashRateLimiting,
      runnerConfigured,
      diagnosticsEnabled,
    },
  };
}
