-- Teacher identities must remain inaccessible until the administrator approves
-- the signed request delivered by email.
ALTER TYPE "AccountStatus" ADD VALUE 'PENDING_TEACHER_APPROVAL';

ALTER TABLE "User"
ADD COLUMN "teacherApprovalRequestedAt" TIMESTAMP(3),
ADD COLUMN "teacherApprovalNotifiedAt" TIMESTAMP(3),
ADD COLUMN "teacherApprovedAt" TIMESTAMP(3);
