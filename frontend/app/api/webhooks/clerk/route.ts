import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { globalRateLimiter } from "@/server/security/rate-limiter";
import { RATE_LIMIT_CONFIGS } from "@/server/security/rate-limit-configs";
import {
  clerkUserDataSchema,
  clerkWebhookEnvelopeSchema,
  isClerkUserEventType,
  verifyClerkWebhookSignature,
} from "@/server/onboarding/clerk-webhook";
import { logEvent } from "@/server/observability/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  const rl = await globalRateLimiter.check(clientIp, RATE_LIMIT_CONFIGS.WEBHOOK);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many webhook requests" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      },
    );
  }

  const rawBody = await req.text();
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logEvent("error", "clerk_webhook_configuration_missing");
    return NextResponse.json(
      { error: "Webhook verification is unavailable." },
      { status: 503 },
    );
  }
  const isValid = verifyClerkWebhookSignature(rawBody, req.headers, webhookSecret);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 },
    );
  }

  let rawEvent: unknown;
  try {
    rawEvent = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const envelope = clerkWebhookEnvelopeSchema.safeParse(rawEvent);
  if (!envelope.success) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
  const { type } = envelope.data;
  if (!isClerkUserEventType(type)) {
    return NextResponse.json({ success: true, ignored: type });
  }
  const parsedData = clerkUserDataSchema.safeParse(envelope.data.data);
  if (!parsedData.success) {
    return NextResponse.json({ error: "Invalid user event data" }, { status: 400 });
  }
  const data = parsedData.data;
  const clerkUserId = data.id;

  const primaryEmail =
    data.email_addresses?.find((e) => e.id === data.primary_email_address_id)
      ?.email_address ??
    data.email_addresses?.[0]?.email_address;

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || "TRACE User";
  try {
    switch (type) {
      case "user.created": {
        // Account creation is completed by the authenticated role-setup action,
        // never by mutable webhook metadata or delivery ordering.
        return NextResponse.json({
          success: true,
          action: "awaiting_role_onboarding",
          userId: clerkUserId,
        });
      }

      case "user.updated": {
        const identity = await prisma.externalIdentity.findUnique({
          where: {
            provider_providerSubject: {
              provider: "clerk",
              providerSubject: clerkUserId,
            },
          },
        });

        if (identity) {
          await prisma.user.update({
            where: { id: identity.userId },
            data: {
              name: fullName,
              ...(primaryEmail ? { email: primaryEmail } : {}),
            },
          });
        }
        return NextResponse.json({
          success: true,
          action: identity ? "updated" : "awaiting_role_onboarding",
          userId: clerkUserId,
        });
      }

      case "user.deleted": {
        const identity = await prisma.externalIdentity.findUnique({
          where: {
            provider_providerSubject: {
              provider: "clerk",
              providerSubject: clerkUserId,
            },
          },
        });

        if (identity) {
          await prisma.user.update({
            where: { id: identity.userId },
            data: { accountStatus: "DISABLED" },
          });
        }
        return NextResponse.json({ success: true, action: "disabled", userId: clerkUserId });
      }
    }
  } catch (error) {
    logEvent("error", "clerk_webhook_processing_failed", {
      eventType: type,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Database synchronization failed" },
      { status: 500 },
    );
  }
}
