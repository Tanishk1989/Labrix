/**
 * In-process SSE Event Bus for real-time notifications.
 * Singleton pattern — keeps listeners across Next.js route handler calls
 * in the same Node.js process.
 *
 * Each listener is keyed by userId so we can fan-out targeted events.
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

// Global singleton — survives across hot-reloads in dev via globalThis
const globalKey = "__labrix_sse_bus__";

interface EventBusGlobal {
  listeners: Map<string, Set<Listener>>;
}

function getBus(): EventBusGlobal {
  if (!(global as any)[globalKey]) {
    (global as any)[globalKey] = { listeners: new Map<string, Set<Listener>>() };
  }
  return (global as any)[globalKey] as EventBusGlobal;
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
}

/**
 * Broadcast a notification to a set of users (e.g. all students in a class).
 */
export function broadcastTo(userIds: string[], event: NotificationEvent): void {
  const bus = getBus();
  for (const uid of userIds) {
    bus.listeners.get(uid)?.forEach((cb) => cb(event));
  }
}

/**
 * Count currently connected listeners.
 */
export function connectedCount(): number {
  const bus = getBus();
  let n = 0;
  bus.listeners.forEach((s) => (n += s.size));
  return n;
}
