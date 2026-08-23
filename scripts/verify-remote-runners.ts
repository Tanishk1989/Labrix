interface RunnerTarget {
  name: "Java" | "C++";
  endpoint: string;
  executionPath: string;
}

const bearerToken = process.env.LABRIX_RUNNER_BEARER_TOKEN?.trim();
const allowHttp = process.env.RUNNER_VERIFY_ALLOW_HTTP === "true";

function configuredTarget(
  name: RunnerTarget["name"],
  variableName: "LABRIX_JAVA_RUNNER_URL" | "LABRIX_CPP_RUNNER_URL",
  executionPath: string,
): RunnerTarget {
  const endpoint = process.env[variableName]?.trim();
  if (!endpoint) {
    throw new Error(`${variableName} is required.`);
  }

  const url = new URL(endpoint);
  if (url.protocol !== "https:" && !(allowHttp && url.protocol === "http:")) {
    throw new Error(`${variableName} must use HTTPS. Set RUNNER_VERIFY_ALLOW_HTTP=true only for local checks.`);
  }

  return { name, endpoint: url.origin, executionPath };
}

async function request(
  url: URL,
  init?: RequestInit,
): Promise<{ status: number; body: string; latencyMs: number }> {
  const startedAt = performance.now();
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(10_000),
  });
  return {
    status: response.status,
    body: await response.text(),
    latencyMs: Math.round(performance.now() - startedAt),
  };
}

async function verifyRunner(target: RunnerTarget) {
  const healthUrl = new URL("/healthz", target.endpoint);
  const executionUrl = new URL(target.executionPath, target.endpoint);

  const health = await request(healthUrl);
  let healthBody: unknown;
  try {
    healthBody = JSON.parse(health.body);
  } catch {
    healthBody = null;
  }
  if (
    health.status !== 200 ||
    !healthBody ||
    typeof healthBody !== "object" ||
    !("status" in healthBody) ||
    healthBody.status !== "ok"
  ) {
    throw new Error(`${target.name} health check failed with HTTP ${health.status}.`);
  }
  console.log(`PASS ${target.name} health (${health.latencyMs}ms)`);

  const unauthorized = await request(executionUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  if (unauthorized.status !== 401) {
    throw new Error(`${target.name} accepted an unauthenticated execution request (HTTP ${unauthorized.status}).`);
  }
  console.log(`PASS ${target.name} rejects unauthenticated execution (${unauthorized.latencyMs}ms)`);

  const authenticated = await request(executionUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${bearerToken}`,
      "content-type": "application/json",
    },
    body: "{}",
  });
  if (authenticated.status !== 400) {
    const reason = authenticated.status === 401 ? "the bearer token was rejected" : `HTTP ${authenticated.status} was returned`;
    throw new Error(`${target.name} authentication check failed: ${reason}.`);
  }
  console.log(`PASS ${target.name} accepts the configured token and validates payloads (${authenticated.latencyMs}ms)`);
}

async function main() {
  if (!bearerToken || bearerToken.length < 32) {
    throw new Error("LABRIX_RUNNER_BEARER_TOKEN must contain at least 32 characters.");
  }

  const targets = [
    configuredTarget("Java", "LABRIX_JAVA_RUNNER_URL", "/v1/execute/java"),
    configuredTarget("C++", "LABRIX_CPP_RUNNER_URL", "/v1/execute/cpp"),
  ];

  for (const target of targets) {
    await verifyRunner(target);
  }

  console.log("Remote runner verification passed.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Remote runner verification failed: ${message}`);
  process.exitCode = 1;
});
