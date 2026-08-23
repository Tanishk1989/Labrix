import { createTeacherApprovalToken } from "./approval-token";

interface TeacherApprovalRequest {
  userId: string;
  name: string;
  email: string;
  requestedAt: Date;
}

interface TeacherApprovalEmailConfig {
  apiKey: string;
  recipient: string;
  sender: string;
  secret: string;
  appUrl: string;
}

function required(name: string, value: string | undefined) {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${name} is required for teacher approvals.`);
  return normalized;
}

function recipientEmail(value: string | undefined) {
  const email = required("TEACHER_APPROVAL_EMAIL", value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("TEACHER_APPROVAL_EMAIL must be a valid email address.");
  }
  return email;
}

function teacherApprovalEmailConfig(fallbackOrigin?: string): TeacherApprovalEmailConfig {
  const configuredAppUrl = process.env.LABRIX_APP_URL?.trim();
  if (process.env.NODE_ENV === "production" && !configuredAppUrl) {
    throw new Error("LABRIX_APP_URL is required for teacher approvals in production.");
  }
  const appUrl = required("LABRIX_APP_URL", configuredAppUrl ?? fallbackOrigin).replace(/\/$/, "");
  const parsedUrl = new URL(appUrl);
  if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "127.0.0.1" && parsedUrl.hostname !== "localhost") {
    throw new Error("LABRIX_APP_URL must use HTTPS outside local development.");
  }
  return {
    apiKey: required("RESEND_API_KEY", process.env.RESEND_API_KEY),
    recipient: recipientEmail(process.env.TEACHER_APPROVAL_EMAIL),
    sender: required("TEACHER_APPROVAL_FROM_EMAIL", process.env.TEACHER_APPROVAL_FROM_EMAIL),
    secret: required("TEACHER_APPROVAL_SECRET", process.env.TEACHER_APPROVAL_SECRET),
    appUrl,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTeacherApprovalEmail(
  request: TeacherApprovalRequest,
  options: { fallbackOrigin?: string; fetchImplementation?: typeof fetch } = {},
) {
  const config = teacherApprovalEmailConfig(options.fallbackOrigin);
  const token = createTeacherApprovalToken(
    { userId: request.userId, requestedAt: request.requestedAt },
    config.secret,
  );
  const approvalUrl = `${config.appUrl}/teacher-approvals/${encodeURIComponent(token)}`;
  const response = await (options.fetchImplementation ?? fetch)("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `teacher-approval/${request.userId}/${request.requestedAt.getTime()}`,
    },
    body: JSON.stringify({
      from: config.sender,
      to: [config.recipient],
      subject: `Teacher account verification: ${request.name}`,
      text: [
        "A new TRACE teacher account is waiting for verification.",
        `Name: ${request.name}`,
        `Email: ${request.email}`,
        `Requested: ${request.requestedAt.toISOString()}`,
        "",
        `Review and approve: ${approvalUrl}`,
        "",
        "The account cannot access teacher features until you approve it.",
      ].join("\n"),
      html: `<h1>Teacher account verification</h1><p>A new TRACE teacher account is waiting for verification.</p><dl><dt>Name</dt><dd>${escapeHtml(request.name)}</dd><dt>Email</dt><dd>${escapeHtml(request.email)}</dd><dt>Requested</dt><dd>${escapeHtml(request.requestedAt.toISOString())}</dd></dl><p><a href="${escapeHtml(approvalUrl)}">Review and approve this teacher</a></p><p>The account cannot access teacher features until you approve it.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Teacher approval email delivery failed with HTTP ${response.status}.`);
  }
}
