import { randomUUID } from "node:crypto";
import {
  claimNextExecutionJob,
  failClaimedExecutionJob,
  processClaimedExecutionJob,
} from "../server/attempts/service";
import { getServerExecutionProvider } from "../server/execution";
import { prisma } from "../lib/db/prisma";

function positiveInteger(value: string | undefined, fallback: number, maximum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

const workerId = process.env.LABRIX_EXECUTION_WORKER_ID ?? `gcp-${randomUUID()}`;
const workerConcurrency = positiveInteger(process.env.EXECUTION_WORKER_CONCURRENCY, 8, 32);
const pollIntervalMs = positiveInteger(process.env.EXECUTION_WORKER_POLL_MS, 500, 10_000);
const leaseMs = positiveInteger(process.env.EXECUTION_JOB_LEASE_MS, 120_000, 600_000);
const maxAttempts = positiveInteger(process.env.EXECUTION_JOB_MAX_ATTEMPTS, 3, 10);
let stopping = false;
const heartbeat = setInterval(() => {
  void prisma.executionWorkerHeartbeat.upsert({
    where: { workerId },
    create: { workerId, concurrency: workerConcurrency },
    update: { concurrency: workerConcurrency },
  }).catch((error) => console.error("Execution worker heartbeat failed", {
    workerId,
    error: error instanceof Error ? error.message : "Unknown heartbeat error",
  }));
}, 10_000);
heartbeat.unref();

async function sleep(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

let nextSlot = 0;

async function processOneJob(job: NonNullable<Awaited<ReturnType<typeof claimNextExecutionJob>>>) {
  try {
    const provider = getServerExecutionProvider(process.env, job.runAttempt.language);
    await processClaimedExecutionJob(job, provider, { maxAttempts });
  } catch (error) {
    console.error("Execution job failed", {
      jobId: job.id,
      workerId,
      error: error instanceof Error ? error.message : "Unknown worker error",
    });
    await failClaimedExecutionJob(job.id, job.lockedBy ?? workerId);
  }
}

async function workLoop() {
  const active = new Set<Promise<void>>();
  let idleDelayMs = pollIntervalMs;
  while (!stopping) {
    let claimedAny = false;
    while (!stopping && active.size < workerConcurrency) {
      nextSlot = (nextSlot % workerConcurrency) + 1;
      const job = await claimNextExecutionJob(`${workerId}:${nextSlot}`, leaseMs);
      if (!job) break;
      claimedAny = true;
      const task = processOneJob(job).finally(() => active.delete(task));
      active.add(task);
    }
    if (claimedAny) {
      idleDelayMs = pollIntervalMs;
      continue;
    }
    if (active.size >= workerConcurrency) {
      await Promise.race(active);
      continue;
    }
    await Promise.race([sleep(idleDelayMs), ...active]);
    if (active.size === 0) idleDelayMs = Math.min(5_000, idleDelayMs * 2);
  }
  await Promise.allSettled(active);
}

async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(heartbeat);
  await prisma.executionWorkerHeartbeat.deleteMany({ where: { workerId } }).catch(() => undefined);
  await prisma.$disconnect();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

console.log(`TRACE execution worker ${workerId} starting with ${workerConcurrency} slots.`);
await prisma.executionWorkerHeartbeat.upsert({
  where: { workerId },
  create: { workerId, concurrency: workerConcurrency },
  update: { concurrency: workerConcurrency, startedAt: new Date() },
});
await workLoop();
