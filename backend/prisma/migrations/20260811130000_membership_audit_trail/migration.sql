-- CreateEnum
CREATE TYPE "MembershipAuditAction" AS ENUM ('DEACTIVATED', 'REACTIVATED');

-- CreateTable
CREATE TABLE "MembershipAuditEntry" (
    "id" TEXT NOT NULL,
    "classroomId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "actorTeacherId" TEXT NOT NULL,
    "action" "MembershipAuditAction" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipAuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MembershipAuditEntry_classroomId_createdAt_idx" ON "MembershipAuditEntry"("classroomId", "createdAt");

-- CreateIndex
CREATE INDEX "MembershipAuditEntry_membershipId_createdAt_idx" ON "MembershipAuditEntry"("membershipId", "createdAt");

-- AddForeignKey
ALTER TABLE "MembershipAuditEntry" ADD CONSTRAINT "MembershipAuditEntry_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipAuditEntry" ADD CONSTRAINT "MembershipAuditEntry_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "ClassMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipAuditEntry" ADD CONSTRAINT "MembershipAuditEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipAuditEntry" ADD CONSTRAINT "MembershipAuditEntry_actorTeacherId_fkey" FOREIGN KEY ("actorTeacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
