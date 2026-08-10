ALTER TABLE "ResultSnapshot"
ADD COLUMN "visiblePassedTests" INTEGER,
ADD COLUMN "visibleTotalTests" INTEGER,
ADD COLUMN "hiddenPassedTests" INTEGER,
ADD COLUMN "hiddenTotalTests" INTEGER,
ADD COLUMN "suggestedScore" DOUBLE PRECISION;

ALTER TABLE "ResultSnapshot"
ADD CONSTRAINT "ResultSnapshot_visible_counts_check"
CHECK (
  ("visiblePassedTests" IS NULL AND "visibleTotalTests" IS NULL)
  OR (
    "visiblePassedTests" >= 0
    AND "visibleTotalTests" >= 0
    AND "visiblePassedTests" <= "visibleTotalTests"
  )
),
ADD CONSTRAINT "ResultSnapshot_hidden_counts_check"
CHECK (
  ("hiddenPassedTests" IS NULL AND "hiddenTotalTests" IS NULL)
  OR (
    "hiddenPassedTests" >= 0
    AND "hiddenTotalTests" >= 0
    AND "hiddenPassedTests" <= "hiddenTotalTests"
  )
),
ADD CONSTRAINT "ResultSnapshot_suggested_score_check"
CHECK ("suggestedScore" IS NULL OR ("suggestedScore" >= 0 AND "suggestedScore" <= 10));
