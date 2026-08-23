-- Email-based teacher approval has been removed. Clerk administrator-controlled
-- public metadata is now the teacher authorization source. Preserve the legacy
-- columns and enum value for backward-compatible, forward-only deployment.
UPDATE "User"
SET
  "accountStatus" = 'ACTIVE',
  "teacherApprovalRequestedAt" = NULL,
  "teacherApprovalNotifiedAt" = NULL,
  "teacherApprovedAt" = NULL
WHERE
  "platformRole" = 'TEACHER'
  AND "accountStatus" = 'PENDING_TEACHER_APPROVAL';
