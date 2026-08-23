"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { verifyTeacherApprovalToken } from "@/server/teacher-approval/approval-token";

const invalidRequestPath = "/teacher-approvals/invalid";

export async function approveTeacherAccount(formData: FormData) {
  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue : "";
  const secret = process.env.TEACHER_APPROVAL_SECRET?.trim() ?? "";
  if (secret.length < 32 || token.length < 1 || token.length > 2_048) {
    redirect(invalidRequestPath);
  }

  const verified = verifyTeacherApprovalToken(token, secret);
  if (!verified) redirect(invalidRequestPath);

  await prisma.user.updateMany({
    where: {
      id: verified.userId,
      platformRole: "TEACHER",
      accountStatus: "PENDING_TEACHER_APPROVAL",
      teacherApprovalRequestedAt: verified.requestedAt,
    },
    data: {
      accountStatus: "ACTIVE",
      teacherApprovedAt: new Date(),
    },
  });

  redirect(`/teacher-approvals/${encodeURIComponent(token)}`);
}
