-- Production execution jobs are durable and claimed by a separate worker.
CREATE TYPE "ExecutionJobKind" AS ENUM ('RUN', 'SUBMIT');
CREATE TYPE "ExecutionJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

ALTER TYPE "ExecutionMode" ADD VALUE IF NOT EXISTS 'JAVA_DOCKER_REMOTE';
ALTER TYPE "ExecutionMode" ADD VALUE IF NOT EXISTS 'CPP_DOCKER_REMOTE';

CREATE TABLE "ExecutionJob" (
    "id" TEXT NOT NULL,
    "runAttemptId" TEXT NOT NULL,
    "codingSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "kind" "ExecutionJobKind" NOT NULL,
    "status" "ExecutionJobStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExecutionJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExecutionJob_runAttemptId_key" ON "ExecutionJob"("runAttemptId");
CREATE UNIQUE INDEX "ExecutionJob_studentId_idempotencyKey_key" ON "ExecutionJob"("studentId", "idempotencyKey");
CREATE INDEX "ExecutionJob_status_availableAt_createdAt_idx" ON "ExecutionJob"("status", "availableAt", "createdAt");
CREATE INDEX "ExecutionJob_codingSessionId_status_idx" ON "ExecutionJob"("codingSessionId", "status");
CREATE UNIQUE INDEX "ExecutionJob_one_active_session_job_idx"
  ON "ExecutionJob"("codingSessionId")
  WHERE "status" IN ('QUEUED', 'RUNNING');

ALTER TABLE "ExecutionJob"
  ADD CONSTRAINT "ExecutionJob_runAttemptId_fkey"
  FOREIGN KEY ("runAttemptId") REFERENCES "RunAttempt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionJob"
  ADD CONSTRAINT "ExecutionJob_codingSessionId_fkey"
  FOREIGN KEY ("codingSessionId") REFERENCES "CodingSession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExecutionJob"
  ADD CONSTRAINT "ExecutionJob_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ExecutionWorkerHeartbeat" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "concurrency" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExecutionWorkerHeartbeat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExecutionWorkerHeartbeat_workerId_key" ON "ExecutionWorkerHeartbeat"("workerId");
