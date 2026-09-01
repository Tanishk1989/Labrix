import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { validateEnvironment } from "@/server/config/env-validator";
import { configuredRelease } from "@/server/observability/runtime-diagnostics";

export const dynamic = "force-dynamic";

const RUNNER_HEALTH_TIMEOUT_MS = 5_000;

async function checkRunner(endpoint: string | undefined) {
  if (!endpoint) return { status: "not-configured" as const };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RUNNER_HEALTH_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const healthUrl = new URL(endpoint);
    healthUrl.pathname = "/healthz";
    healthUrl.search = "";
    const response = await fetch(healthUrl, {
      cache: "no-store",
      signal: controller.signal,
    });
    return {
      status: response.ok ? ("connected" as const) : ("error" as const),
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return { status: "error" as const };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const configuration = validateEnvironment();
  const shouldCheckRunners =
    process.env.NODE_ENV === "production" &&
    configuration.features.runnerConfigured;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (dbError) {
    console.error("Database health check failed:", dbError);
    return NextResponse.json(
      {
        status: "degraded",
        release: configuredRelease(),
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }

  const [javaRunner, cppRunner] = shouldCheckRunners
    ? await Promise.all([
        checkRunner(process.env.LABRIX_JAVA_RUNNER_URL),
        checkRunner(process.env.LABRIX_CPP_RUNNER_URL),
      ])
    : [{ status: "not-checked" as const }, { status: "not-checked" as const }];

  const queueEnabled = configuredQueueHealth(configuration.isValid);
  const activeWorkers = queueEnabled
    ? await prisma.executionWorkerHeartbeat.findMany({
        where: { lastSeenAt: { gt: new Date(Date.now() - 30_000) } },
        select: { workerId: true, concurrency: true, lastSeenAt: true },
      })
    : [];
  const runnersHealthy =
    !shouldCheckRunners ||
    (javaRunner.status === "connected" && cppRunner.status === "connected");
  const workersHealthy = !queueEnabled || activeWorkers.length > 0;
  const healthy = configuration.isValid && runnersHealthy && workersHealthy;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      release: configuredRelease(),
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

function configuredQueueHealth(configurationValid: boolean) {
  return configurationValid && process.env.LABRIX_EXECUTION_DISPATCH === "queued";
}
