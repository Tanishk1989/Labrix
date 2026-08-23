import { describe, expect, it } from "vitest";
import {
  broadcastTo,
  connectedCount,
  publishTo,
  subscribe,
  type NotificationEvent,
} from "@/lib/notification-bus";

describe("NotificationBus Lifecycle", () => {
  const sampleEvent: NotificationEvent = {
    type: "PRACTICAL_PUBLISHED",
    title: "New Practical Available",
    body: "Arrays & Pointers practical is now live.",
    timestamp: new Date().toISOString(),
  };

  it("subscribes and receives targeted notifications", () => {
    const received: NotificationEvent[] = [];
    const unsubscribe = subscribe("user-test-1", (evt) => {
      received.push(evt);
    });

    expect(connectedCount()).toBeGreaterThanOrEqual(1);

    publishTo("user-test-1", sampleEvent);
    expect(received.length).toBe(1);
    expect(received[0].title).toBe("New Practical Available");

    unsubscribe();
  });

  it("does not deliver targeted events to other users", () => {
    const receivedA: NotificationEvent[] = [];
    const receivedB: NotificationEvent[] = [];

    const unsubA = subscribe("user-alpha", (e) => receivedA.push(e));
    const unsubB = subscribe("user-beta", (e) => receivedB.push(e));

    publishTo("user-alpha", sampleEvent);

    expect(receivedA.length).toBe(1);
    expect(receivedB.length).toBe(0);

    unsubA();
    unsubB();
  });

  it("broadcasts notifications to multiple enrolled users", () => {
    const received1: NotificationEvent[] = [];
    const received2: NotificationEvent[] = [];

    const unsub1 = subscribe("student-1", (e) => received1.push(e));
    const unsub2 = subscribe("student-2", (e) => received2.push(e));

    broadcastTo(["student-1", "student-2"], sampleEvent);

    expect(received1.length).toBe(1);
    expect(received2.length).toBe(1);

    unsub1();
    unsub2();
  });
});
