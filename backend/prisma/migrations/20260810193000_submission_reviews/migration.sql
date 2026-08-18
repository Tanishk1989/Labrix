-- CreateEnum
CREATE TYPE "SubmissionReviewStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "SubmissionReview" (
    "id" TEXT NOT NULL,
    "submissionAttemptId" TEXT NOT NULL,
    "reviewerTeacherId" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "marksAwarded" INTEGER NOT NULL,
    "marksOutOf" INTEGER NOT NULL DEFAULT 10,
    "status" "SubmissionReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionReview_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SubmissionReview_fixed_marks_scale" CHECK ("marksOutOf" = 10),
    CONSTRAINT "SubmissionReview_marks_bounds" CHECK ("marksAwarded" >= 0 AND "marksAwarded" <= "marksOutOf")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionReview_submissionAttemptId_key" ON "SubmissionReview"("submissionAttemptId");

-- CreateIndex
CREATE INDEX "SubmissionReview_reviewerTeacherId_status_idx" ON "SubmissionReview"("reviewerTeacherId", "status");

-- AddForeignKey
ALTER TABLE "SubmissionReview" ADD CONSTRAINT "SubmissionReview_submissionAttemptId_fkey" FOREIGN KEY ("submissionAttemptId") REFERENCES "SubmissionAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionReview" ADD CONSTRAINT "SubmissionReview_reviewerTeacherId_fkey" FOREIGN KEY ("reviewerTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
