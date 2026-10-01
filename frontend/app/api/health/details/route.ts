import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { validateEnvironment } from "@/server/config/env-validator";
import {
  configuredRelease,
  isDiagnosticsRequestAuthorized,
} from "@/server/observability/runtime-diagnostics";

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
    const response = await fetch(healthUrl, { cache: "no-store", signal: controller.signal });
    const body = await response.json().catch(() => null) as {
      activeWorkers?: number;
      queueLength?: number;
    } | null;
    return {
      status: response.ok ? "connected" as const : "error" as const,
      latencyMs: Date.now() - startedAt,
      activeWorkers: body?.activeWorkers ?? null,
      queueLength: body?.queueLength ?? null,
    };
  } catch {
    return { status: "error" as const };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkJudge0() {
  const endpoint = process.env.JUDGE0_API_URL;
  if (!endpoint) return { status: "not-configured" as const };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RUNNER_HEALTH_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const url = new URL(endpoint);
    url.pathname = `${url.pathname.replace(/\/$/, "")}/workers`;
    const response = await fetch(url, {
      headers: {
        ...(process.env.JUDGE0_API_KEY ? {
          "x-rapidapi-key": process.env.JUDGE0_API_KEY,
          "x-rapidapi-host": process.env.JUDGE0_API_HOST ?? url.host,
        } : {}),
        ...(process.env.JUDGE0_AUTH_TOKEN ? { "x-auth-token": process.env.JUDGE0_AUTH_TOKEN } : {}),
      },
      cache: "no-store",
      signal: controller.signal,
    });
    return { status: response.ok ? "connected" as const : "error" as const, latencyMs: Date.now() - startedAt };
  } catch {
    return { status: "error" as const };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkWandbox() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RUNNER_HEALTH_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const response = await fetch("https://wandbox.org/api/list.json", { cache: "no-store", signal: controller.signal });
    return { status: response.ok ? "connected" as const : "error" as const, latencyMs: Date.now() - startedAt };
  } catch {
    return { status: "error" as const };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  if (!isDiagnosticsRequestAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ status: "not-found" }, { status: 404 });
  }

  const configuration = validateEnvironment();
  const databaseStartedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    return NextResponse.json({
      status: "degraded",
      release: configuredRelease(),
      timestamp: new Date().toISOString(),
      database: { status: "error" },
    }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } });
  }
  const databaseLatencyMs = Date.now() - databaseStartedAt;

  const judge0Mode = process.env.LABRIX_EXECUTION_PROVIDER === "judge0";
  const wandboxMode = process.env.LABRIX_EXECUTION_PROVIDER === "wandbox";
  const [java, cpp, judge0, wandbox, queued, running, failed, failedLastHour, oldestQueued, activeWorkers] = await Promise.all([
    checkRunner(process.env.LABRIX_JAVA_RUNNER_URL),
    checkRunner(process.env.LABRIX_CPP_RUNNER_URL),
    judge0Mode ? checkJudge0() : Promise.resolve({ status: "not-checked" as const }),
    wandboxMode ? checkWandbox() : Promise.resolve({ status: "not-checked" as const }),
    prisma.executionJob.count({ where: { status: "QUEUED" } }),
    prisma.executionJob.count({ where: { status: "RUNNING" } }),
    prisma.executionJob.count({ where: { status: "FAILED" } }),
    prisma.executionJob.count({
      where: { status: "FAILED", updatedAt: { gt: new Date(Date.now() - 60 * 60 * 1_000) } },
    }),
    prisma.executionJob.findFirst({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.executionWorkerHeartbeat.findMany({
      where: { lastSeenAt: { gt: new Date(Date.now() - 30_000) } },
      select: { concurrency: true },
    }),
  ]);
  const runnersHealthy = judge0Mode
    ? judge0.status === "connected"
    : wandboxMode
      ? wandbox.status === "connected"
    : java.status === "connected" && cpp.status === "connected";
  const workersHealthy = judge0Mode || wandboxMode || activeWorkers.length > 0;
  const healthy = configuration.isValid && runnersHealthy && workersHealthy;

  return NextResponse.json({
    status: healthy ? "healthy" : "degraded",
    release: configuredRelease(),
    timestamp: new Date().toISOString(),
    database: { status: "connected", latencyMs: databaseLatencyMs },
    configuration: {
      status: configuration.isValid ? "valid" : "invalid",
      warnings: configuration.warnings,
      missingRequired: configuration.missingRequired,
    },
    runners: judge0Mode ? { judge0 } : wandboxMode ? { wandbox } : { java, cpp },
    executionQueue: {
      queued,
      running,
      failed,
      failedLastHour,
      oldestQueuedAgeMs: oldestQueued ? Date.now() - oldestQueued.createdAt.getTime() : 0,
      workersOnline: activeWorkers.length,
      capacity: activeWorkers.reduce((total, worker) => total + worker.concurrency, 0),
    },
  }, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
