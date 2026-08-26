# Execution provider production safety

## Provider classes

TRACE currently has three selectable execution modes:

| Configuration | Purpose | Production status |
| --- | --- | --- |
| unset or `mock` | Deterministic simulated feedback; no language execution | Default in every environment |
| `java-http` | Separate loopback-only local Java Docker worker | Development/test proof only |
| `cpp-http` | Separate loopback-only local C++ Docker worker | Development/test proof only |
| `local-docker` | Language-routed Java and C++ loopback workers | Supervised local demo only |

There is no production execution provider yet. The local workers are single-host, single-flight proofs without the queues, scaling, availability policy, isolation review, observability, image lifecycle, incident response, or abuse testing required for production.

## Fail-closed production guard

When `NODE_ENV=production`, selecting `java-http`, `cpp-http`, or `local-docker` throws a configuration error before a provider is returned. The exceptional override is deliberately explicit and exact:

```dotenv
LABRIX_ALLOW_LOCAL_RUNNERS_IN_PRODUCTION=true
```

Any missing value, alternate casing, or other value is rejected. This flag records operator acknowledgment only; it does not certify the worker as production-ready. Production deployments should leave the provider unset/`mock` until a separately approved production provider exists.

The guard is evaluated server-side whenever TRACE resolves the configured execution provider, including workspace loading and Run/Submit service entry. Errors begin with `Invalid execution provider configuration` and identify the rejected provider or variable. Provider selection never falls back silently.

## Local URL boundary

Both local adapters require their own URL:

```dotenv
LABRIX_JAVA_RUNNER_URL=http://127.0.0.1:4010/v1/execute/java
LABRIX_CPP_RUNNER_URL=http://127.0.0.1:4020/v1/execute/cpp
```

Development, test, and an explicitly acknowledged production exception all enforce the same boundary:

- scheme must be plain `http`;
- hostname must be exactly `127.0.0.1`, `localhost`, or `::1`;
- embedded URL credentials are rejected;
- missing and malformed URLs produce explicit configuration errors.

The production exception does not permit remote URLs or HTTPS endpoints. A future remote production provider needs a separate provider type and an explicit decision covering authentication, transport security, tenancy, queueing, retries, data handling, and operational ownership.

## Verification

Focused unit tests cover mock default selection, development/test loopback allowance, production rejection, the exact exceptional flag, and malformed/remote/authenticated URL rejection. Runner smoke and workspace acceptance suites remain separate and do not weaken this configuration boundary.
