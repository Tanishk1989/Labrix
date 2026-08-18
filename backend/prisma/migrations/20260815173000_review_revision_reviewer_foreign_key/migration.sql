ALTER TABLE "SubmissionReviewRevision"
ADD CONSTRAINT "SubmissionReviewRevision_reviewerTeacherId_fkey"
FOREIGN KEY ("reviewerTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
