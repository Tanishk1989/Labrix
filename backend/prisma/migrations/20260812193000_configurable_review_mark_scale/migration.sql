ALTER TABLE "SubmissionReview"
DROP CONSTRAINT "SubmissionReview_fixed_marks_scale";

ALTER TABLE "SubmissionReview"
ADD CONSTRAINT "SubmissionReview_marks_check"
CHECK ("marksOutOf" > 0 AND "marksAwarded" >= 0 AND "marksAwarded" <= "marksOutOf");
