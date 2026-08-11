export const EXECUTION_RUN_COOLDOWN_MS = 1_000;

export type ExecutionRequestKind = "run" | "submit";
export type ExecutionRequestGuardCode = "in_progress" | "cooldown";

export class ExecutionRequestGuardError extends Error {
  constructor(readonly code: ExecutionRequestGuardCode) {
    super(
      code === "in_progress"
        ? "A run is already in progress."
        : "Please wait before running again.",
    );
    this.name = "ExecutionRequestGuardError";
  }
}

interface SessionGuardState {
  active: boolean;
  cleanupTimer?: ReturnType<typeof setTimeout>;
  lastRunStartedAt?: number;
}

interface ExecutionRequestGuardOptions {
  cooldownMs?: number;
  now?: () => number;
}

export class ExecutionRequestGuard {
  private readonly cooldownMs: number;
  private readonly now: () => number;
  private readonly sessions = new Map<string, SessionGuardState>();

  constructor(options: ExecutionRequestGuardOptions = {}) {
    this.cooldownMs = options.cooldownMs ?? EXECUTION_RUN_COOLDOWN_MS;
    this.now = options.now ?? Date.now;
  }

  async execute<T>(
    input: {
      studentId: string;
      sessionId: string;
      kind: ExecutionRequestKind;
    },
    operation: () => Promise<T>,
  ): Promise<T> {
    const key = `${input.studentId}\0${input.sessionId}`;
    const state = this.sessions.get(key) ?? { active: false };
    if (state.active) throw new ExecutionRequestGuardError("in_progress");

    const startedAt = this.now();
    if (
      input.kind === "run" &&
      state.lastRunStartedAt !== undefined &&
      startedAt - state.lastRunStartedAt < this.cooldownMs
    ) {
      throw new ExecutionRequestGuardError("cooldown");
    }

    if (state.cleanupTimer) clearTimeout(state.cleanupTimer);
    state.cleanupTimer = undefined;
    state.active = true;
    if (input.kind === "run") state.lastRunStartedAt = startedAt;
    this.sessions.set(key, state);

    try {
      return await operation();
    } finally {
      state.active = false;
      this.scheduleCleanup(key, state);
    }
  }

  clear() {
    for (const state of this.sessions.values()) {
      if (state.cleanupTimer) clearTimeout(state.cleanupTimer);
    }
    this.sessions.clear();
  }

  private scheduleCleanup(key: string, state: SessionGuardState) {
    if (state.active) return;
    if (state.lastRunStartedAt === undefined) {
      this.sessions.delete(key);
      return;
    }

    const remainingMs = Math.max(
      1,
      this.cooldownMs - (this.now() - state.lastRunStartedAt),
    );
    state.cleanupTimer = setTimeout(() => {
      if (this.sessions.get(key) !== state || state.active) return;
      if (this.now() - state.lastRunStartedAt! >= this.cooldownMs) {
        this.sessions.delete(key);
        return;
      }
      this.scheduleCleanup(key, state);
    }, remainingMs);
    state.cleanupTimer.unref?.();
  }
}

export const executionRequestGuard = new ExecutionRequestGuard();
