import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { validateEnvironment } from "@/server/config/env-validator";

export const dynamic = "force-dynamic";

async function checkRunner(endpoint: string | undefined) {
  if (!endpoint) return { status: "not-configured" as const };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2_000);
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
      status: response.ok ? "connected" as const : "error" as const,
      latencyMs: Date.now() - startedAt,
    };
  } catch {
    return { status: "error" as const };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const startTime = Date.now();
  const configuration = validateEnvironment();
  const shouldCheckRunners = process.env.NODE_ENV === "production" && configuration.features.runnerConfigured;
  let dbStatus = "connected";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbStatus = "error";
    return NextResponse.json(
      {
        status: "degraded",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          status: "error",
        },
        configuration: {
          status: configuration.isValid ? "valid" : "error",
        },
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
  const runnersHealthy = !shouldCheckRunners ||
    (javaRunner.status === "connected" && cppRunner.status === "connected");
  const healthy = configuration.isValid && runnersHealthy;
  const status = healthy ? "healthy" : "degraded";
  const statusCode = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status,
      version: "0.1.0",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      configuration: {
        status: configuration.isValid ? "valid" : "error",
      },
      runners: {
        java: javaRunner,
        cpp: cppRunner,
      },
    },
    {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
