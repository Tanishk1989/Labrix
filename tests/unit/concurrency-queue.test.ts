import { describe, expect, it } from "vitest";
import { ExecutionConcurrencyQueue } from "@/server/execution/concurrency-queue";

describe("ExecutionConcurrencyQueue", () => {
  it("caps concurrent executions to maxConcurrent limit", async () => {
    const queue = new ExecutionConcurrencyQueue({ maxConcurrent: 2 });
    let active = 0;
    let maxActiveSeen = 0;

    const createJob = (durationMs: number) => () =>
      queue.run(async () => {
        active++;
        maxActiveSeen = Math.max(maxActiveSeen, active);
        await new Promise((r) => setTimeout(r, durationMs));
        active--;
        return "ok";
      });

    const jobs = Array.from({ length: 6 }, () => createJob(40)());
    const results = await Promise.all(jobs);

    expect(results).toEqual(["ok", "ok", "ok", "ok", "ok", "ok"]);
    expect(maxActiveSeen).toBeLessThanOrEqual(2);
  });

  it("processes waiting tasks in FIFO order", async () => {
    const queue = new ExecutionConcurrencyQueue({ maxConcurrent: 1 });
    const order: number[] = [];

    const job1 = queue.run(async () => {
      await new Promise((r) => setTimeout(r, 30));
      order.push(1);
    });

    const job2 = queue.run(async () => {
      await new Promise((r) => setTimeout(r, 10));
      order.push(2);
    });

    const job3 = queue.run(async () => {
      await new Promise((r) => setTimeout(r, 10));
      order.push(3);
    });

    await Promise.all([job1, job2, job3]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("times out requests that wait longer than timeoutMs", async () => {
    const queue = new ExecutionConcurrencyQueue({
      maxConcurrent: 1,
      timeoutMs: 50,
    });

    // Blocker job holds the single slot for 120ms
    const blocker = queue.run(async () => {
      await new Promise((r) => setTimeout(r, 120));
      return "blocker-done";
    });

    // Second job will time out after 50ms in queue
    const queuedJob = queue.run(async () => {
      return "never-runs";
    });

    await expect(queuedJob).rejects.toThrow(/timed out waiting in concurrency queue/i);
    await expect(blocker).resolves.toBe("blocker-done");
  });
});
