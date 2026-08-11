CREATE TYPE "ExecutionMode" AS ENUM (
  'SIMULATED',
  'JAVA_DOCKER_LOCAL',
  'CPP_DOCKER_LOCAL'
);

ALTER TABLE "ResultSnapshot"
ADD COLUMN "executionMode" "ExecutionMode";
