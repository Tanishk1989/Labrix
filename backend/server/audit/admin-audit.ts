import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logEvent } from "@/server/observability/logger";

export interface LogAdminActionInput {
  actorUserId: string;
  action:
    | "ROLE_CHANGED"
    | "ACCOUNT_STATUS_CHANGED"
    | "JOIN_CODE_ROTATED"
    | "ENROLLMENT_SETTINGS_UPDATED"
    | "AI_POLICY_UPDATED"
    | "TEACHER_APPROVED"
    | "CLASSROOM_CREATED"
    | "CLASSROOM_ARCHIVED";
  targetType: "USER" | "CLASSROOM" | "SYSTEM" | "PRACTICAL";
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Persist an immutable administrative audit event.
 */
export async function logAdminAction(input: LogAdminActionInput) {
  try {
    return await prisma.adminAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        metadata: input.metadata ? (input.metadata as Prisma.InputJsonValue) : undefined,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    logEvent("error", "admin_audit_write_failed", {
      action: input.action,
      targetType: input.targetType,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return null;
  }
}
