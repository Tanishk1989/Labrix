-- AlterTable Classroom
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "joinCodeExpiresAt" TIMESTAMP(3);
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "joinCodeRotatedAt" TIMESTAMP(3);
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "enrollmentOpen" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "enrollmentStartsAt" TIMESTAMP(3);
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "enrollmentEndsAt" TIMESTAMP(3);
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "requireTeacherApproval" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "aiAssistanceEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable AdminAuditLog
CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable AiGenerationAuditLog
CREATE TABLE IF NOT EXISTS "AiGenerationAuditLog" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "submissionAttemptId" TEXT,
    "kind" TEXT NOT NULL,
    "modelUsed" TEXT NOT NULL,
    "promptTokenEstimate" INTEGER NOT NULL,
    "cachedResult" BOOLEAN NOT NULL DEFAULT false,
    "durationMs" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "sourceCodeHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGenerationAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AdminAuditLog_actorUserId_createdAt_idx" ON "AdminAuditLog"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

CREATE INDEX IF NOT EXISTS "AiGenerationAuditLog_teacherId_createdAt_idx" ON "AiGenerationAuditLog"("teacherId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiGenerationAuditLog_sourceCodeHash_idx" ON "AiGenerationAuditLog"("sourceCodeHash");
CREATE INDEX IF NOT EXISTS "AiGenerationAuditLog_submissionAttemptId_idx" ON "AiGenerationAuditLog"("submissionAttemptId");

-- AddForeignKey ClassroomHintPolicy -> User
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ClassroomHintPolicy_updatedByTeacherId_fkey'
    ) THEN
        ALTER TABLE "ClassroomHintPolicy" ADD CONSTRAINT "ClassroomHintPolicy_updatedByTeacherId_fkey" FOREIGN KEY ("updatedByTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey StudentHintPermission -> User (grantedByTeacher)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'StudentHintPermission_grantedByTeacherId_fkey'
    ) THEN
        ALTER TABLE "StudentHintPermission" ADD CONSTRAINT "StudentHintPermission_grantedByTeacherId_fkey" FOREIGN KEY ("grantedByTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey HintInteraction -> User (student)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'HintInteraction_studentId_fkey'
    ) THEN
        ALTER TABLE "HintInteraction" ADD CONSTRAINT "HintInteraction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey HintInteraction -> Classroom
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'HintInteraction_classroomId_fkey'
    ) THEN
        ALTER TABLE "HintInteraction" ADD CONSTRAINT "HintInteraction_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey HintInteraction -> Task
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'HintInteraction_taskId_fkey'
    ) THEN
        ALTER TABLE "HintInteraction" ADD CONSTRAINT "HintInteraction_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey AdminAuditLog -> User
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AdminAuditLog_actorUserId_fkey'
    ) THEN
        ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey AiGenerationAuditLog -> User
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AiGenerationAuditLog_teacherId_fkey'
    ) THEN
        ALTER TABLE "AiGenerationAuditLog" ADD CONSTRAINT "AiGenerationAuditLog_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey AiGenerationAuditLog -> SubmissionAttempt
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AiGenerationAuditLog_submissionAttemptId_fkey'
    ) THEN
        ALTER TABLE "AiGenerationAuditLog" ADD CONSTRAINT "AiGenerationAuditLog_submissionAttemptId_fkey" FOREIGN KEY ("submissionAttemptId") REFERENCES "SubmissionAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
