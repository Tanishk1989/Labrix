/**
 * SSE Route Handler — GET /api/notifications
 *
 * Students and teachers connect here; the server keeps the connection
 * open and streams events as they happen (practical published, grade ready, etc.)
 *
 * Auth: demo actor resolved from cookie — no external dep needed.
 * The userId from the actor is used as the subscription key in the bus.
 */

import { subscribe, type NotificationEvent } from "@/lib/notification-bus";
import { resolveCurrentActor } from "@/server/actors/current-actor";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // Resolve identity — gracefully handle unauthenticated
  let userId: string;
  try {
    const actor = await resolveCurrentActor({ demoActor: "student" });
    if (!actor || !actor.id) {
      return new Response("Unauthorized", { status: 401 });
    }
    userId = actor.id;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send an initial keep-alive comment so the browser knows the connection is live
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Subscribe to bus events for this user
      const unsubscribe = subscribe(userId, (event: NotificationEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          // Stream closed — clean up below
        }
      });

      // Heartbeat every 25 seconds to prevent proxy/nginx timeouts
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 25_000);

      // Cleanup when client disconnects
      // (ReadableStream cancellation signal)
      return () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
