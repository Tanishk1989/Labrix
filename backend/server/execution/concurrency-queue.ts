import type { ExecutionMode } from "@/domain/execution/execution-mode";
import type {
  ServerExecutionProvider,
  ServerExecutionRequest,
  ServerExecutionResult,
} from "./provider";

export interface ConcurrencyQueueOptions {
  maxConcurrent: number;
  maxQueueSize?: number;
  timeoutMs?: number;
}

export class ExecutionConcurrencyQueue {
  private maxConcurrent: number;
  private maxQueueSize: number;
  private timeoutMs: number;
  private activeCount = 0;
  private queue: Array<{
    task: () => Promise<unknown>;
    resolve: (val: unknown) => void;
    reject: (err: unknown) => void;
    timer: NodeJS.Timeout | null;
  }> = [];

  constructor(options: ConcurrencyQueueOptions) {
    this.maxConcurrent = options.maxConcurrent || 6;
    this.maxQueueSize = options.maxQueueSize || 200;
    this.timeoutMs = options.timeoutMs || 25_000;
  }

  get stats() {
    return {
      activeCount: this.activeCount,
      queuedCount: this.queue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      try {
        return await fn();
      } finally {
        this.activeCount--;
        this.dequeue();
      }
    }

    if (this.queue.length >= this.maxQueueSize) {
      throw new Error(
        "Execution server is at maximum queue capacity. Please wait a few seconds and try again.",
      );
    }

    return new Promise<T>((resolve, reject) => {
      let timer: NodeJS.Timeout | null = null;
      if (this.timeoutMs > 0) {
        timer = setTimeout(() => {
          const index = this.queue.findIndex((item) => item.resolve === (resolve as unknown));
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(
              new Error("Execution request timed out waiting in concurrency queue."),
            );
          }
        }, this.timeoutMs);
      }

      this.queue.push({
        task: fn as () => Promise<unknown>,
        resolve: resolve as (val: unknown) => void,
        reject,
        timer,
      });
    });
  }

  private dequeue() {
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const next = this.queue.shift();
    if (!next) return;

    if (next.timer) {
      clearTimeout(next.timer);
    }

    this.activeCount++;
    (async () => {
      try {
        const result = await next.task();
        next.resolve(result);
      } catch (err) {
        next.reject(err);
      } finally {
        this.activeCount--;
        this.dequeue();
      }
    })();
  }
}

// Global concurrency queue singleton
const defaultMaxConcurrent = parseInt(
  process.env.LABRIX_MAX_CONCURRENT_RUNNERS || "6",
  10,
);

export const globalExecutionQueue = new ExecutionConcurrencyQueue({
  maxConcurrent: isNaN(defaultMaxConcurrent) ? 6 : defaultMaxConcurrent,
  maxQueueSize: 200,
  timeoutMs: 30_000,
});

/**
 * Decorator that transparently routes execution requests through the concurrency limiter
 */
export class QueuedServerExecutionProvider implements ServerExecutionProvider {
  constructor(
    private readonly inner: ServerExecutionProvider,
    private readonly queue: ExecutionConcurrencyQueue = globalExecutionQueue,
  ) {}

  get executionMode(): ExecutionMode {
    return this.inner.executionMode;
  }

  async execute(request: ServerExecutionRequest): Promise<ServerExecutionResult> {
    return this.queue.run(() => this.inner.execute(request));
  }
}
