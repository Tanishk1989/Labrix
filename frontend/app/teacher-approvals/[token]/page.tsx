import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { TraceLogo } from "@/components/trace-logo";
import { approveTeacherAccount } from "@/features/teacher-approval/actions";
import { verifyTeacherApprovalToken } from "@/server/teacher-approval/approval-token";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teacher verification",
  robots: { index: false, follow: false, nocache: true },
};

function ApprovalState({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen items-center px-4 py-12 sm:px-6">
      <section className="mx-auto w-full max-w-2xl border-y border-[var(--border)] py-10 sm:py-12">
        <div className="mb-6"><TraceLogo size={22} /></div>
        <p className="eyebrow">TRACE administration</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </section>
    </main>
  );
}

export default async function TeacherApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const secret = process.env.TEACHER_APPROVAL_SECRET?.trim() ?? "";
  if (secret.length < 32) {
    return (
      <ApprovalState
        title="Verification is not configured"
        description="The approval secret is missing or invalid. Configure it on the TRACE server before using this link."
      />
    );
  }

  const verified = verifyTeacherApprovalToken(token, secret);
  if (!verified) {
    return (
      <ApprovalState
        title="Invalid or expired request"
        description="This teacher verification link is invalid or has expired. Ask the administrator to generate a new request."
      />
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: verified.userId },
    select: {
      name: true,
      email: true,
      platformRole: true,
      accountStatus: true,
      teacherApprovalRequestedAt: true,
      teacherApprovedAt: true,
    },
  });
  const requestMatches =
    user?.teacherApprovalRequestedAt?.getTime() === verified.requestedAt.getTime();

  if (
    user?.platformRole === "TEACHER" &&
    user.accountStatus === "ACTIVE" &&
    user.teacherApprovedAt &&
    requestMatches
  ) {
    return (
      <ApprovalState
        title="Teacher approved"
        description={`${user.name} (${user.email}) can now sign in and use teacher features.`}
      />
    );
  }

  if (
    !user ||
    user.platformRole !== "TEACHER" ||
    user.accountStatus !== "PENDING_TEACHER_APPROVAL" ||
    !requestMatches
  ) {
    return (
      <ApprovalState
        title="Request is no longer pending"
        description="This request has already changed or is no longer eligible for approval. No account changes were made."
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center px-4 py-12 sm:px-6">
      <section className="mx-auto w-full max-w-2xl border-y border-[var(--border)] py-10 sm:py-12">
        <div className="mb-6"><TraceLogo size={22} /></div>
        <p className="eyebrow">TRACE administration</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Verify teacher account</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Confirm this person should receive teacher access. Approval allows them to create classrooms, publish practicals, and review student work.
        </p>
        <dl className="mt-7 grid gap-4 border-y border-[var(--border)] py-5 text-sm sm:grid-cols-2">
          <div><dt className="text-[var(--text-muted)]">Name</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{user.name}</dd></div>
          <div><dt className="text-[var(--text-muted)]">Email</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{user.email}</dd></div>
          <div><dt className="text-[var(--text-muted)]">Requested</dt><dd className="mt-1 font-semibold text-[var(--text-primary)]">{verified.requestedAt.toLocaleString("en-IN")}</dd></div>
          <div><dt className="text-[var(--text-muted)]">Current access</dt><dd className="mt-1 font-semibold text-amber-400">Blocked pending verification</dd></div>
        </dl>
        <form action={approveTeacherAccount} className="mt-7">
          <input name="token" type="hidden" value={token} />
          <button className="button min-h-11" type="submit">Approve teacher account</button>
        </form>
      </section>
    </main>
  );
}
