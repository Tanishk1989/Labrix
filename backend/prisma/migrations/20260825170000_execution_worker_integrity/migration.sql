-- Idempotent integrity follow-up for environments that applied the queue while
-- worker-heartbeat and redundant ownership constraints were still being added.
CREATE TABLE IF NOT EXISTS "ExecutionWorkerHeartbeat" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "concurrency" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExecutionWorkerHeartbeat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExecutionWorkerHeartbeat_workerId_key"
  ON "ExecutionWorkerHeartbeat"("workerId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExecutionJob_codingSessionId_fkey') THEN
    ALTER TABLE "ExecutionJob"
      ADD CONSTRAINT "ExecutionJob_codingSessionId_fkey"
      FOREIGN KEY ("codingSessionId") REFERENCES "CodingSession"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExecutionJob_studentId_fkey') THEN
    ALTER TABLE "ExecutionJob"
      ADD CONSTRAINT "ExecutionJob_studentId_fkey"
      FOREIGN KEY ("studentId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
