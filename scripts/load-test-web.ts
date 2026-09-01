export {};

const baseUrl = process.env.LABRIX_LOAD_TEST_BASE_URL;
if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
  throw new Error("Set LABRIX_LOAD_TEST_BASE_URL to the staging deployment URL.");
}
const concurrency = Math.min(Number(process.env.LABRIX_LOAD_TEST_USERS ?? 100), 250);
const requestsPerUser = Math.min(Number(process.env.LABRIX_LOAD_TEST_REQUESTS_PER_USER ?? 10), 100);
// Model ordinary signed-out browser navigation. Runtime health is verified
// separately because students do not poll the database/runner health endpoint.
const paths = ["/", "/sign-in", "/privacy"];
const latencies: number[] = [];
let failures = 0;

await Promise.all(Array.from({ length: concurrency }, async (_, user) => {
  for (let request = 0; request < requestsPerUser; request++) {
    const startedAt = performance.now();
    try {
      const response = await fetch(new URL(paths[(user + request) % paths.length], baseUrl), {
        redirect: "manual",
        headers: { "user-agent": "TRACE-staging-load-test/1.0" },
      });
      if (response.status >= 500) failures++;
      await response.arrayBuffer();
    } catch {
      failures++;
    } finally {
      latencies.push(performance.now() - startedAt);
    }
  }
}));

latencies.sort((a, b) => a - b);
const percentile = (value: number) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * value))] ?? 0;
const total = concurrency * requestsPerUser;
const failureRate = failures / total;
console.log(JSON.stringify({
  users: concurrency,
  requests: total,
  failures,
  failureRate,
  p50Ms: Math.round(percentile(0.5)),
  p95Ms: Math.round(percentile(0.95)),
  p99Ms: Math.round(percentile(0.99)),
}, null, 2));
if (failureRate > 0.01 || percentile(0.95) > 2_000) process.exitCode = 1;
