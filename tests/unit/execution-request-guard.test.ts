import { describe, expect, it } from "vitest";
import { ExecutionRequestGuard } from "@/server/execution/request-guard";

const request = {
  studentId: "student-one",
  sessionId: "session-one",
} as const;

function deferred() {
  let resolve = () => {};
  const promise = new Promise<void>((release) => {
    resolve = release;
  });
  return { promise, resolve };
}

describe("execution request guard", () => {
  it("allows the first run", async () => {
    const guard = new ExecutionRequestGuard();

    await expect(
      guard.execute({ ...request, kind: "run" }, async () => "completed"),
    ).resolves.toBe("completed");
    guard.clear();
  });

  it("rejects repeated runs during the cooldown", async () => {
    let now = 10_000;
    const guard = new ExecutionRequestGuard({
      cooldownMs: 1_000,
      now: () => now,
    });
    await guard.execute({ ...request, kind: "run" }, async () => undefined);

    await expect(
      guard.execute({ ...request, kind: "run" }, async () => undefined),
    ).rejects.toMatchObject({
      code: "cooldown",
      message: "Please wait before running again.",
    });

    now += 1_000;
    await expect(
      guard.execute({ ...request, kind: "run" }, async () => "allowed"),
    ).resolves.toBe("allowed");
    guard.clear();
  });

  it("rejects overlapping execution for the same session", async () => {
    const guard = new ExecutionRequestGuard();
    const gate = deferred();
    const first = guard.execute({ ...request, kind: "run" }, async () => {
      await gate.promise;
    });

    await expect(
      guard.execute({ ...request, kind: "submit" }, async () => undefined),
    ).rejects.toMatchObject({
      code: "in_progress",
      message: "A run is already in progress.",
    });

    await expect(
      guard.execute(
        { ...request, sessionId: "session-two", kind: "run" },
        async () => "independent",
      ),
    ).resolves.toBe("independent");
    gate.resolve();
    await first;
    guard.clear();
  });

  it("protects overlapping submits but permits a retry after completion", async () => {
    const guard = new ExecutionRequestGuard();
    const gate = deferred();
    let operations = 0;
    const first = guard.execute({ ...request, kind: "submit" }, async () => {
      operations += 1;
      await gate.promise;
      return "submission-id";
    });

    await expect(
      guard.execute({ ...request, kind: "submit" }, async () => {
        operations += 1;
      }),
    ).rejects.toMatchObject({ code: "in_progress" });
    expect(operations).toBe(1);

    gate.resolve();
    await expect(first).resolves.toBe("submission-id");
    await expect(
      guard.execute({ ...request, kind: "submit" }, async () => {
        operations += 1;
        return "same-idempotent-submission";
      }),
    ).resolves.toBe("same-idempotent-submission");
    expect(operations).toBe(2);
    guard.clear();
  });
});
