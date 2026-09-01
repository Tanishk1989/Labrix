import { boundedInteger, evaluateClubCapacity, summarizeLoad } from "./club-capacity";

const baseUrl = (process.env.TRACE_BASE_URL ?? process.argv[2] ?? "").replace(/\/$/, "");
if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  throw new Error("Set TRACE_BASE_URL to the staging or production origin.");
}

const students = boundedInteger(process.env.TRACE_CLUB_STUDENTS, 50, 1, 250);
const requestsPerStudent = boundedInteger(process.env.TRACE_CLUB_WEB_REQUESTS_PER_STUDENT, 3, 1, 20);
const minimumExecutionCapacity = boundedInteger(
  process.env.TRACE_CLUB_MIN_EXECUTION_CAPACITY,
  8,
  1,
  250,
);
const requestTimeoutMs = 15_000;
const paths = ["/", "/api/health", "/sign-in"];

async function timedFetch(url: string, init?: RequestInit) {
  const startedAt = performance.now();
  try {
    const response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(requestTimeoutMs),
      headers: {
        "user-agent": "TRACE-club-capacity-rehearsal/1.0",
        ...init?.headers,
      },
    });
    await response.arrayBuffer();
    return { latencyMs: performance.now() - startedAt, failed: response.status >= 500 };
  } catch {
    return { latencyMs: performance.now() - startedAt, failed: true };
  }
}

async function runWebLoad() {
  for (const path of paths) {
    await timedFetch(new URL(path, `${baseUrl}/`).toString());
  }
  const latencies: number[] = [];
  let failures = 0;
  await Promise.all(Array.from({ length: students }, async (_, student) => {
    for (let request = 0; request < requestsPerStudent; request++) {
      const path = paths[(student + request) % paths.length] ?? "/";
      const result = await timedFetch(new URL(path, `${baseUrl}/`).toString(), { redirect: "manual" });
      latencies.push(result.latencyMs);
      if (result.failed) failures += 1;
    }
  }));
  return summarizeLoad(latencies, failures);
}

type Diagnostics = {
  executionQueue?: { capacity?: number };
};

async function readExecutionCapacity() {
  const token = process.env.TRACE_DIAGNOSTICS_TOKEN;
  if (!token || token.length < 32) return null;
  try {
    const response = await fetch(new URL("/api/health/details", `${baseUrl}/`), {
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs),
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const diagnostics = await response.json() as Diagnostics;
    return typeof diagnostics.executionQueue?.capacity === "number"
      ? diagnostics.executionQueue.capacity
      : null;
  } catch {
    return null;
  }
}

async function runRunnerBurst() {
  const token = process.env.LABRIX_RUNNER_BEARER_TOKEN;
  const javaUrl = process.env.LABRIX_JAVA_RUNNER_URL;
  const cppUrl = process.env.LABRIX_CPP_RUNNER_URL;
  if (!token || token.length < 32 || !javaUrl || !cppUrl) return null;

  const latencies: number[] = [];
  let failures = 0;
  await Promise.all(Array.from({ length: students }, async (_, index) => {
    const java = index % 2 === 0;
    const endpoint = java ? javaUrl : cppUrl;
    const payload = java
      ? { language: "JAVA", sourceCode: "public class Main { public static void main(String[] args) { System.out.println(2); } }" }
      : { language: "CPP", sourceCode: "#include <iostream>\nint main(){std::cout << 2;}" };
    const startedAt = performance.now();
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(90_000),
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "user-agent": "TRACE-club-capacity-rehearsal/1.0",
        },
        body: JSON.stringify({
          ...payload,
          tests: [{ id: `club-${index}`, input: "", expectedOutput: "2", visibility: "VISIBLE" }],
          limits: { wallTimeMs: 2_000, outputBytes: 16_384, network: "none" },
        }),
      });
      const body = await response.json() as { state?: string };
      if (!response.ok || body.state !== "completed") failures += 1;
    } catch {
      failures += 1;
    } finally {
      latencies.push(performance.now() - startedAt);
    }
  }));
  return summarizeLoad(latencies, failures);
}

const [web, runners, executionCapacity] = await Promise.all([
  runWebLoad(),
  runRunnerBurst(),
  readExecutionCapacity(),
]);
const verdict = evaluateClubCapacity({ web, runners, executionCapacity, minimumExecutionCapacity });
console.log(JSON.stringify({
  target: baseUrl,
  students,
  web,
  runners,
  executionCapacity,
  minimumExecutionCapacity,
  verdict,
  limits: [
    "Web traffic covers public and signed-out routes.",
    "Runner traffic exercises compiler capacity directly; authenticated Run/Submit acceptance remains a separate pre-class check.",
  ],
}, null, 2));
if (verdict.status !== "PASSED") process.exitCode = 1;
