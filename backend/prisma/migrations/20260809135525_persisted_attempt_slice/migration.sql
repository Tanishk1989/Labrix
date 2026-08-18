-- CreateEnum
CREATE TYPE "CodingSessionStatus" AS ENUM ('ACTIVE', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "RunResultState" AS ENUM ('COMPLETED', 'COMPILATION_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'INTERNAL_ERROR');

-- CreateEnum
CREATE TYPE "CodeEventType" AS ENUM ('SESSION_STARTED', 'DRAFT_SAVED', 'RUN_REQUESTED', 'RUN_COMPLETED', 'SUBMISSION_CREATED');

-- CreateTable
CREATE TABLE "CodingSession" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "CodingSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "language" "AllowedLanguage" NOT NULL DEFAULT 'CPP',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "CodingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL,
    "codingSessionId" TEXT NOT NULL,
    "sourceCode" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunAttempt" (
    "id" TEXT NOT NULL,
    "codingSessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "language" "AllowedLanguage" NOT NULL,
    "sourceCodeSnapshot" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RunAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultSnapshot" (
    "id" TEXT NOT NULL,
    "runAttemptId" TEXT NOT NULL,
    "state" "RunResultState" NOT NULL,
    "passedTests" INTEGER NOT NULL,
    "totalTests" INTEGER NOT NULL,
    "errorText" TEXT,
    "testResults" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionAttempt" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "codingSessionId" TEXT NOT NULL,
    "resultSnapshotId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "language" "AllowedLanguage" NOT NULL,
    "sourceCodeSnapshot" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeEvent" (
    "id" TEXT NOT NULL,
    "codingSessionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "CodeEventType" NOT NULL,
    "runAttemptId" TEXT,
    "submissionAttemptId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodingSession_taskId_studentId_status_idx" ON "CodingSession"("taskId", "studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CodingSession_taskId_studentId_attemptNumber_key" ON "CodingSession"("taskId", "studentId", "attemptNumber");

-- Only one mutable attempt may be active for a student and practical.
CREATE UNIQUE INDEX "CodingSession_one_active_per_student_task_key"
ON "CodingSession"("taskId", "studentId")
WHERE "status" = 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "Draft_codingSessionId_key" ON "Draft"("codingSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RunAttempt_codingSessionId_sequence_key" ON "RunAttempt"("codingSessionId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "ResultSnapshot_runAttemptId_key" ON "ResultSnapshot"("runAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAttempt_codingSessionId_key" ON "SubmissionAttempt"("codingSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAttempt_resultSnapshotId_key" ON "SubmissionAttempt"("resultSnapshotId");

-- CreateIndex
CREATE INDEX "SubmissionAttempt_taskId_studentId_submittedAt_idx" ON "SubmissionAttempt"("taskId", "studentId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAttempt_taskId_studentId_attemptNumber_key" ON "SubmissionAttempt"("taskId", "studentId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionAttempt_studentId_idempotencyKey_key" ON "SubmissionAttempt"("studentId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "CodeEvent_codingSessionId_occurredAt_idx" ON "CodeEvent"("codingSessionId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "CodeEvent_codingSessionId_sequence_key" ON "CodeEvent"("codingSessionId", "sequence");

-- AddForeignKey
ALTER TABLE "CodingSession" ADD CONSTRAINT "CodingSession_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodingSession" ADD CONSTRAINT "CodingSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_codingSessionId_fkey" FOREIGN KEY ("codingSessionId") REFERENCES "CodingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunAttempt" ADD CONSTRAINT "RunAttempt_codingSessionId_fkey" FOREIGN KEY ("codingSessionId") REFERENCES "CodingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultSnapshot" ADD CONSTRAINT "ResultSnapshot_runAttemptId_fkey" FOREIGN KEY ("runAttemptId") REFERENCES "RunAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAttempt" ADD CONSTRAINT "SubmissionAttempt_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAttempt" ADD CONSTRAINT "SubmissionAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAttempt" ADD CONSTRAINT "SubmissionAttempt_codingSessionId_fkey" FOREIGN KEY ("codingSessionId") REFERENCES "CodingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionAttempt" ADD CONSTRAINT "SubmissionAttempt_resultSnapshotId_fkey" FOREIGN KEY ("resultSnapshotId") REFERENCES "ResultSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeEvent" ADD CONSTRAINT "CodeEvent_codingSessionId_fkey" FOREIGN KEY ("codingSessionId") REFERENCES "CodingSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeEvent" ADD CONSTRAINT "CodeEvent_runAttemptId_fkey" FOREIGN KEY ("runAttemptId") REFERENCES "RunAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeEvent" ADD CONSTRAINT "CodeEvent_submissionAttemptId_fkey" FOREIGN KEY ("submissionAttemptId") REFERENCES "SubmissionAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Submitted attempts and their result snapshots are append-only historical facts.
CREATE FUNCTION "prevent_labrix_immutable_update"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'immutable Labrix record cannot be updated';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "SubmissionAttempt_prevent_update"
BEFORE UPDATE ON "SubmissionAttempt"
FOR EACH ROW EXECUTE FUNCTION "prevent_labrix_immutable_update"();

CREATE TRIGGER "ResultSnapshot_prevent_update"
BEFORE UPDATE ON "ResultSnapshot"
FOR EACH ROW EXECUTE FUNCTION "prevent_labrix_immutable_update"();
