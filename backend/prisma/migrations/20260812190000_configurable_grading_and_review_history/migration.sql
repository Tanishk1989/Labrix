ALTER TABLE "Task"
ADD COLUMN "maximumMarks" INTEGER NOT NULL DEFAULT 10;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_maximumMarks_check"
CHECK ("maximumMarks" BETWEEN 1 AND 1000);

CREATE TABLE "RubricCriterion" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "maximumMarks" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RubricCriterion_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RubricCriterion_maximumMarks_check" CHECK ("maximumMarks" > 0)
);

CREATE UNIQUE INDEX "RubricCriterion_taskId_position_key"
ON "RubricCriterion"("taskId", "position");

ALTER TABLE "RubricCriterion"
ADD CONSTRAINT "RubricCriterion_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SubmissionReviewCriterionScore" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "marksAwarded" INTEGER NOT NULL,
  CONSTRAINT "SubmissionReviewCriterionScore_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SubmissionReviewCriterionScore_marksAwarded_check" CHECK ("marksAwarded" >= 0)
);

CREATE UNIQUE INDEX "SubmissionReviewCriterionScore_reviewId_criterionId_key"
ON "SubmissionReviewCriterionScore"("reviewId", "criterionId");

ALTER TABLE "SubmissionReviewCriterionScore"
ADD CONSTRAINT "SubmissionReviewCriterionScore_reviewId_fkey"
FOREIGN KEY ("reviewId") REFERENCES "SubmissionReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SubmissionReviewCriterionScore"
ADD CONSTRAINT "SubmissionReviewCriterionScore_criterionId_fkey"
FOREIGN KEY ("criterionId") REFERENCES "RubricCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "SubmissionReviewRevision" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "reviewerTeacherId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "feedback" TEXT NOT NULL,
  "marksAwarded" INTEGER NOT NULL,
  "marksOutOf" INTEGER NOT NULL,
  "status" "SubmissionReviewStatus" NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "rubricScores" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubmissionReviewRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SubmissionReviewRevision_marks_check" CHECK ("marksAwarded" >= 0 AND "marksOutOf" > 0 AND "marksAwarded" <= "marksOutOf")
);

CREATE UNIQUE INDEX "SubmissionReviewRevision_reviewId_version_key"
ON "SubmissionReviewRevision"("reviewId", "version");

CREATE INDEX "SubmissionReviewRevision_reviewId_createdAt_idx"
ON "SubmissionReviewRevision"("reviewId", "createdAt");

ALTER TABLE "SubmissionReviewRevision"
ADD CONSTRAINT "SubmissionReviewRevision_reviewId_fkey"
FOREIGN KEY ("reviewId") REFERENCES "SubmissionReview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TRIGGER "SubmissionReviewRevision_prevent_update"
BEFORE UPDATE ON "SubmissionReviewRevision"
FOR EACH ROW EXECUTE FUNCTION "prevent_labrix_immutable_update"();
