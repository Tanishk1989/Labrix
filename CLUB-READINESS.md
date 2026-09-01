# TRACE club-readiness status

Assessment date: 2026-09-01

## Current verdict

**NO-GO for an unsupervised 40–50 student event. Suitable for a small supervised beta.**

The live web deployment completed a 50-user/150-request rehearsal against
user-facing routes with zero failures, 466 ms p50, 947 ms p95, and 992 ms p99
latency. The public production verifier passed all 13 checks. Live diagnostics
reported one execution worker with capacity 2, which is below the repository's
club gate of 8 and has not been proven with a synchronized 50-job runner burst.

## Completed in this readiness pass

- Static checks, 331 unit tests, 69 integration tests, 3 browser acceptance tests, and the production build passed.
- The time-sensitive read-only browser test was made deterministic and now passes with aged demo data.
- Queued/running jobs are rediscovered after workspace reload and resume polling.
- Rate-limit and temporary polling failures now retain actionable recovery wording.
- Public liveness is minimal and identifies the deployed release.
- Detailed database, runner, worker, queue, and capacity diagnostics are bearer-protected.
- `verify:club-capacity` fails closed without web, runner, and worker-capacity evidence.
- `verify:preclass` fails closed without fresh backup, restore-drill, and authenticated-smoke evidence.
- CI uses a genuinely separate disposable database and runs integration plus browser acceptance tests.
- A local checksum-verified backup and isolated restore drill completed successfully on 2026-09-01.
- Production release `3177cdb45f086bbdc8e44f289023ced933175df0` passed the public 13-check verifier.

## Remaining launch gates

1. Configure the same unique `TRACE_DIAGNOSTICS_TOKEN` in production hosting and GitHub Actions so protected monitoring can run.
2. Increase production execution-worker capacity from 2 to at least 8.
3. Run `npm run verify:club-capacity` with live runner credentials until it passes.
4. Complete a real Clerk teacher/student join, autosave, Run, Submit, reload, and review smoke test.
5. Verify an off-host production backup and record a production-target restore drill.
6. Configure alert delivery for queue age, failed jobs, missing workers, database latency, and backup age.
7. Run `npm run verify:preclass`; open enrollment only when it reports `GO`.

Do not advertise guaranteed uptime or simultaneous-compilation capacity until
all remaining gates pass in the target production environment.
