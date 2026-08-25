export {};

const token = process.env.LABRIX_RUNNER_BEARER_TOKEN;
const javaUrl = process.env.LABRIX_JAVA_RUNNER_URL;
const cppUrl = process.env.LABRIX_CPP_RUNNER_URL;
if (!token || token.length < 32 || !javaUrl || !cppUrl) {
  throw new Error("Set both runner URLs and the 32+ character runner bearer token.");
}
const burst = Math.min(Number(process.env.LABRIX_RUNNER_LOAD_BURST ?? 100), 250);
const requests = Array.from({ length: burst }, (_, index) => {
  const java = index % 2 === 0;
  return {
    endpoint: java ? javaUrl : cppUrl,
    payload: java
      ? { language: "JAVA", sourceCode: "public class Main { public static void main(String[] args) { System.out.println(2); } }" }
      : { language: "CPP", sourceCode: "#include <iostream>\nint main(){std::cout << 2;}" },
  };
});
const latencies: number[] = [];
let failures = 0;
await Promise.all(requests.map(async ({ endpoint, payload }, index) => {
  const startedAt = performance.now();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        tests: [{ id: `load-${index}`, input: "", expectedOutput: "2", visibility: "VISIBLE" }],
        limits: { wallTimeMs: 2_000, outputBytes: 16_384, network: "none" },
      }),
    });
    const body = await response.json() as { state?: string };
    if (!response.ok || body.state !== "completed") failures++;
  } catch {
    failures++;
  } finally {
    latencies.push(performance.now() - startedAt);
  }
}));
latencies.sort((a, b) => a - b);
const p95 = latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] ?? 0;
console.log(JSON.stringify({ burst, failures, failureRate: failures / burst, p95Ms: Math.round(p95) }, null, 2));
if (failures > 0 || p95 > 60_000) process.exitCode = 1;
