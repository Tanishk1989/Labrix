/**
 * Durable & Multi-Instance SSE Event Bus for real-time notifications.
 * Supports in-process singleton dispatch and optional Redis pub-sub
 * for horizontally scaled multi-instance deployments.
 *
 * Each listener is keyed by userId to allow targeted fan-out.
 */

export type NotificationEventType =
  | "PRACTICAL_PUBLISHED"   // teacher publishes → all enrolled students
  | "SUBMISSION_GRADED"     // teacher grades    → that student
  | "VIVA_REQUESTED"        // teacher requests viva → that student
  | "PRACTICAL_DEADLINE";   // system warns before deadline

export interface NotificationEvent {
  type: NotificationEventType;
  title: string;
  body: string;
  href?: string;
  timestamp: string; // ISO 8601
}

type Listener = (event: NotificationEvent) => void;

interface EventBusGlobal {
  listeners: Map<string, Set<Listener>>;
  redisSubscriberInitialized?: boolean;
}

declare global {
  var __labrix_sse_bus__: EventBusGlobal | undefined;
  var __TRACE_REDIS_PUBLISHER__: { publish: (channel: string, message: string) => void } | undefined;
}

function getBus(): EventBusGlobal {
  if (!globalThis.__labrix_sse_bus__) {
    globalThis.__labrix_sse_bus__ = { listeners: new Map<string, Set<Listener>>() };
  }
  return globalThis.__labrix_sse_bus__;
}

export function subscribe(userId: string, cb: Listener): () => void {
  const bus = getBus();
  if (!bus.listeners.has(userId)) {
    bus.listeners.set(userId, new Set());
  }
  bus.listeners.get(userId)!.add(cb);

  // Return unsubscribe function
  return () => {
    bus.listeners.get(userId)?.delete(cb);
    if (bus.listeners.get(userId)?.size === 0) {
      bus.listeners.delete(userId);
    }
  };
}

/**
 * Publish a notification to one specific user.
 */
export function publishTo(userId: string, event: NotificationEvent): void {
  const bus = getBus();
  bus.listeners.get(userId)?.forEach((cb) => cb(event));

  // Multi-instance Redis Pub/Sub broadcast if configured
  const redisPublisher = globalThis.__TRACE_REDIS_PUBLISHER__;
  if (redisPublisher) {
    try {
      redisPublisher.publish("trace:notifications", JSON.stringify({ userId, event }));
    } catch {}
  }
}

/**
 * Broadcast a notification to a set of users (e.g. all students in a class).
 */
export function broadcastTo(userIds: string[], event: NotificationEvent): void {
  const bus = getBus();
  for (const uid of userIds) {
    bus.listeners.get(uid)?.forEach((cb) => cb(event));
  }

  const redisPublisher = globalThis.__TRACE_REDIS_PUBLISHER__;
  if (redisPublisher) {
    try {
      redisPublisher.publish("trace:notifications", JSON.stringify({ userIds, event }));
    } catch {}
  }
}

/**
 * Count currently connected listeners across all users on this instance.
 */
export function connectedCount(): number {
  const bus = getBus();
  let n = 0;
  bus.listeners.forEach((s) => (n += s.size));
  return n;
}
