CREATE TYPE "SubmissionTimingStatus" AS ENUM ('ON_TIME', 'LATE');

ALTER TABLE "SubmissionAttempt"
ADD COLUMN "timingStatus" "SubmissionTimingStatus";
