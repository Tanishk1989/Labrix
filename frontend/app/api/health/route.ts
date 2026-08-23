import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
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
      },
      { status: 503 },
    );
  }

  const memory = process.memoryUsage();

  return NextResponse.json(
    {
      status: "healthy",
      version: "0.1.0",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
      },
      environment: process.env.NODE_ENV ?? "development",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
