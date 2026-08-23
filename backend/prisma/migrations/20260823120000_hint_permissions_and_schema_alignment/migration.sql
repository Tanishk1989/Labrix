DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubmissionTimingStatus') THEN
    CREATE TYPE "SubmissionTimingStatus" AS ENUM ('ON_TIME', 'LATE');
  END IF;
END $$;

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "SubmissionAttempt"
  ADD COLUMN IF NOT EXISTS "practicalVersion" INTEGER,
  ADD COLUMN IF NOT EXISTS "timingStatus" "SubmissionTimingStatus";

CREATE TABLE "ClassroomHintPolicy" (
  "id" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "enabledForAll" BOOLEAN NOT NULL DEFAULT false,
  "updatedByTeacherId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassroomHintPolicy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentHintPermission" (
  "id" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL,
  "grantedByTeacherId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentHintPermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HintInteraction" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "classroomId" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "codingSessionId" TEXT NOT NULL,
  "hintLevel" INTEGER NOT NULL,
  "category" TEXT NOT NULL,
  "hintText" TEXT NOT NULL,
  "nextQuestion" TEXT NOT NULL,
  "focusLines" INTEGER[],
  "inputContextHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HintInteraction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassroomHintPolicy_classroomId_key"
  ON "ClassroomHintPolicy"("classroomId");
CREATE INDEX "StudentHintPermission_classroomId_studentId_idx"
  ON "StudentHintPermission"("classroomId", "studentId");
CREATE UNIQUE INDEX "StudentHintPermission_classroomId_studentId_key"
  ON "StudentHintPermission"("classroomId", "studentId");
CREATE INDEX "HintInteraction_codingSessionId_hintLevel_idx"
  ON "HintInteraction"("codingSessionId", "hintLevel");
CREATE INDEX "HintInteraction_taskId_studentId_idx"
  ON "HintInteraction"("taskId", "studentId");
CREATE INDEX "HintInteraction_classroomId_studentId_idx"
  ON "HintInteraction"("classroomId", "studentId");

ALTER TABLE "ClassroomHintPolicy"
  ADD CONSTRAINT "ClassroomHintPolicy_classroomId_fkey"
  FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentHintPermission"
  ADD CONSTRAINT "StudentHintPermission_classroomId_fkey"
  FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentHintPermission"
  ADD CONSTRAINT "StudentHintPermission_studentId_fkey"
  FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "HintInteraction"
  ADD CONSTRAINT "HintInteraction_codingSessionId_fkey"
  FOREIGN KEY ("codingSessionId") REFERENCES "CodingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
