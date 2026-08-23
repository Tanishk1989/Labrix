# TRACE launch-readiness audit

Audited 23 August 2026 against the locally running application at `http://localhost:3000`, the current workspace, environment configuration, database state, automated checks, and deployment assets.

## Verdict

TRACE is a promising pre-production prototype, but it is not ready for a real class yet. The core domain and authorization code are substantially built, and the current unit suite is healthy. The release path, identity provisioning, class-scale execution, integration verification, privacy controls, and operations are not production-ready.

Recommended release status: **NO-GO for unsupervised classroom use**. A tightly supervised one-computer pilot is possible only after creating a teacher account and accepting the local-runner limits, but that is not the same as a production launch.

## Flow evidence

1. **Public landing — usable, with misleading sample state.** Desktop and mobile layouts render cleanly, primary CTAs work, and the mobile hero is responsive. The page still shows hard-coded review numbers, a sample source file, test results, and “working TRACE demo” copy after demo data was removed.
   - `audit-evidence/01-landing.png`
   - `audit-evidence/04-landing-mobile.png`
2. **Authentication — functional shell, development-only configuration.** Clerk renders after a several-second client-side wait and visibly reports “Development mode.” Branding is inconsistent: TRACE/TRACE OS outside, “Sign in to Labrix” inside.
   - `audit-evidence/03-sign-in-full.png`
3. **Mobile authentication — poor task priority.** At 390×844 the marketing panel occupies multiple screenfuls before the actual sign-in form. A student must scroll past decorative evidence cards to reach the primary task.
   - `audit-evidence/07-sign-in-mobile.png`
4. **Protected app entry — correctly gated, but core audit blocked.** `/dashboard` redirects to `/sign-in`. There is no usable teacher account in the connected data, so classroom creation, publishing, student join, code execution, submission, and review could not be captured as current production flows. This is itself the primary launch blocker.
   - `audit-evidence/05-dashboard-auth-gate.png`
   - `audit-evidence/06-dashboard-auth-gate-loaded.png`

## P0 — launch blockers

### 1. There is no teacher who can start a class

- The connected database contains two real Clerk-linked users, both `STUDENT`, with zero teachers, classrooms, tasks, and submissions.
- New Clerk users default to `STUDENT`; teacher creation depends on Clerk metadata or the manual `scripts/set-user-role.ts` command.
- There is no administrator UI, first-owner bootstrap, invitation flow, or documented production approval path for teachers.
- Result: nobody can create the first classroom, generate a join code, or publish a practical.

### 2. Authentication is still a development Clerk instance

- `.env.local` uses Clerk development keys; the visible Clerk component says “Development mode.”
- `CLERK_WEBHOOK_SECRET` is missing. The webhook intentionally returns HTTP 503 without it (`frontend/app/api/webhooks/clerk/route.ts`).
- Existing linked accounts may sign in, but reliable production user lifecycle sync and role updates are not configured.
- Production domain/origin behavior and multi-device classroom access have not been verified.

### 3. Real code execution cannot handle a class

- Each Java and C++ runner has a single `executionInProgress` flag. The second concurrent request receives HTTP 503 “runner is busy” (`backend/runner/*/server.ts`).
- The web process queue defaults to six concurrent executions, but the two workers can actually process only one request per language. This mismatch converts ordinary class bursts into failures rather than useful queuing.
- The runners are explicitly local, loopback-only proofs. They cannot be reached from Vercel or another separate web host because runner URLs are required to be `localhost`/`127.0.0.1`.
- Container isolation is thoughtfully configured (network disabled, dropped capabilities, read-only root, non-root user, CPU/memory/PID/time limits), but there is no multi-worker scheduler, durable queue, autoscaling, worker authentication, or production operations model.

### 4. The documented Docker production stack cannot build/run the app as written

- The Dockerfile copies `/app/public` and `/app/.next`, but this repository builds to `/app/frontend/public` and `/app/frontend/.next`. The expected source paths do not exist at the repository root.
- `docker-compose.yml` does not provide Clerk keys, webhook secret, AI config, execution provider, or runners.
- It publishes PostgreSQL on all host interfaces with a committed fixed password and does not run migrations as a release step.
- It calls itself a “complete production stack,” which it is not.

### 5. The current integration gate is red

- `npm run typecheck`: passed.
- `npm run test:unit`: 48 files, 228 tests passed.
- `npm run lint`: exit 0, but 77 warnings.
- `npm run test:integration`: **10 suites failed; all 65 tests skipped** because the configured remote Neon test database could not be reached.
- The test configuration stores a mutation-enabled remote database in `.env.test.local`. Safety checks only prove it differs from the development database; they do not require a local/ephemeral host or a database name marked as disposable.
- The CI job is named “Lint, Test & Production Build” but does not run lint, integration tests, end-to-end tests, migration tests, dependency audit, or production Clerk tests. It builds with demo identity explicitly allowed.

### 6. Known high-severity dependency advisories remain

`npm audit --omit=dev` reports seven vulnerabilities: five high, one moderate, and one low. Affected dependency paths include `deepmerge-ts`/Prisma config, `effect`, `nanoid`, and DOMPurify through Monaco. Some fixes require dependency/version review rather than blindly running a forced downgrade.

## P1 — serious production and classroom risks

### 7. Rate limiting exists only as unused code

- `backend/server/security/rate-limiter.ts` defines policies for auth, save, run, submit, and AI generation.
- There are no call sites for `checkRateLimit` anywhere in the app.
- Upstash is not configured. Even if wired, the current fallback is process-local memory and will not protect multiple instances.
- Join-code attempts, code runs, autosaves, submissions, and AI calls are therefore not rate-limited.

### 8. Join codes are brute-forceable at classroom scale

- Codes use only the first five hexadecimal characters of a UUID: roughly 20 bits, about one million combinations (`CLASS-ABCDE`).
- The lookup action has no rate limit, lockout, expiry, rotation, enrollment window, or teacher approval.
- A leaked or guessed code grants active class membership to a signed-in student.

### 9. Student code is sent to external AI automatically

- Opening a teacher submission review invokes Groq (or Gemini fallback) during page rendering and sends the complete submitted source code, task title, test ratio, and integrity/process context.
- There is no teacher opt-in, student notice/consent, institutional policy switch, redaction, data residency control, request audit, cost budget, caching, or rate limiting.
- Reloading the page can generate another external request.
- Provider output is trusted after `JSON.parse` without validating the full returned structure. The result claims `groundedInAST: true`, although the local analysis is regex/heuristic-based rather than a real language AST in this path.
- This needs a privacy/DPA decision before real student work is processed.

### 10. “Immutable” is a product promise, not a storage guarantee

- Application services create append-only submission attempts and review revisions, which is a good start.
- The database does not enforce append-only behavior with permissions, triggers, signed hashes, WORM storage, or an external audit log. A database operator or future mutation path can change records.
- Marketing repeatedly says “immutable submissions” without qualifying this as application-level immutability.

### 11. Real-time notifications do not survive production topology

- Notifications use an in-process global event bus and an SSE connection per browser.
- Events are lost on restart and do not cross instances. There is no Redis/pub-sub or durable notification store.
- `NotificationProvider` wraps the entire app, including public landing and sign-in pages, creating unnecessary signed-out notification connection attempts.

### 12. Missing browser security policy

- HSTS, frame, MIME, referrer, and permissions headers exist.
- There is no Content Security Policy. This matters because the app loads Clerk scripts, Google Fonts, Monaco, and external AI-related surfaces and handles student source code.
- Google fonts are runtime network dependencies rather than self-hosted assets; lint also flags the current font integration.

### 13. No production operations baseline

No implementation or runbook was found for:

- automated database backups and restore drills;
- recovery point/recovery time targets;
- error tracking, structured logs, traces, metrics, alerting, or runner saturation dashboards;
- data retention/deletion/export policies;
- incident response and key rotation;
- environment promotion, migration rollback, or zero-downtime release checks;
- support/admin tools for account collisions, disabled users, teacher approvals, or lost access.

The public health check confirms DB connectivity but currently reports an 815 ms database query in development. It does not test Clerk, AI, runner health, queue saturation, or notification delivery.

### 14. The production verification script gives false confidence

- `scripts/verify-production.ts` is hard-coded to an old Vercel URL.
- It treats many pages as healthy by searching response HTML for generic words, does not authenticate, and can mistake a sign-in redirect for a working protected page.
- It does not create a classroom, join a student, run code, submit, review, test authorization boundaries, or verify real execution.

### 15. Data-model audit links are incomplete

- `ClassroomHintPolicy.updatedByTeacherId` and `StudentHintPermission.grantedByTeacherId` are plain strings without teacher foreign keys.
- `HintInteraction.studentId`, `classroomId`, and `taskId` are plain strings without relations.
- These records can become orphaned or internally inconsistent, weakening the very auditability the product advertises.

## P2 — product, UX, accessibility, and maintainability debt

### 16. Demo state is still visible and present in the codebase

- The landing page hard-codes “5 pending reviews,” “2h ago,” `5/6` tests, `83%`, sample Java code, and “2 questions ready.”
- The final CTA says “working TRACE demo” and “Open TRACE demo.”
- Demo authentication components, demo actors, seeded fixtures, mock execution, demo scripts, demo e2e journeys, and extensive demo documentation remain in the repository. They are mostly unreachable in Clerk mode, but the demo surface has not been removed.

### 17. Authentication UX is deprioritized on mobile

- At 390×844 the sign-in form appears below a long marketing/evidence panel and multiple decorative cards.
- The primary user task should be first, especially for students joining from phones.
- The Clerk widget also took several seconds to appear during repeated local captures, leaving a blank right-hand area first.

### 18. Brand and terminology are inconsistent

- Repository/package name and auth widget say Labrix.
- Marketing and navigation say TRACE, TRACE OS, TRACE Lab OS, and “TRACELAB OS.”
- This leaks implementation history into the user experience and support language.

### 19. The landing page overstates current readiness

- Pre-auth cards say “READY,” “Evidence engine Active,” and “designed around accountable assessment” even when the connected account has no class data and production services are incomplete.
- “AI-powered academic integrity” sounds like a verdicting system; the actual implementation is heuristic assistance and generated viva questions. Copy should stress teacher decision-making and limitations.
- The mobile hamburger-looking control is only an anchor to `#workflow`, not a menu. Its appearance and behavior do not match.

### 20. Accessibility has not been accepted

- Several small landing labels use `text-white/35` or `text-white/40` on a near-black background; these combinations are likely below WCAG AA for normal text.
- The mobile sign-in task order is poor for keyboard/screen-magnifier users as well as touch users.
- There is no automated axe/Lighthouse accessibility gate, no documented keyboard/screen-reader pass, and no tested high-contrast/reduced-motion acceptance.
- This audit could inspect semantics and visible states, but it did not replace manual screen-reader testing.

### 21. Lint “passes” with suppressed debt

- Current lint result: 77 warnings, including unused components/props, explicit `any`, a missing React hook dependency in the persisted workspace, direct `window.location.href` navigation, and font integration.
- ESLint rules were changed to downgrade/disable categories, so exit 0 is not equivalent to a clean codebase.
- The missing hook dependency is especially risky in the run/autosave workspace because stale closures can produce inconsistent behavior.

### 22. Automated test coverage is incomplete

- No coverage thresholds or report are configured.
- E2E covers the demo journey, not real Clerk sign-in, webhook lifecycle, teacher provisioning, multi-browser teacher/student concurrency, mobile onboarding, runner saturation, reconnect/offline behavior, or production deployment.
- Runner acceptance tests are mixed into the integration suite and depend on external infrastructure; today they never execute.

### 23. Repository/release hygiene is not ready

- The working tree has 26 modified tracked files and many untracked implementation, migration, screenshot, and audit files.
- The latest schema migration is untracked, so another checkout/deploy would not receive it.
- There is no clean, reviewed, reproducible release commit or tag.
- Root-level QA screenshots and comparison artifacts are mixed with product source instead of being ignored or stored as intentional documentation assets.

### 24. Documentation contradicts the implementation

- One guide recommends Vercel with `LABRIX_EXECUTION_PROVIDER=mock`, while production code explicitly rejects mock execution.
- Another declares the app “100% production ready” and “high-concurrency,” contradicted by single-flight runners and the failing integration gate.
- `DEPLOYMENT.md` omits `CLERK_WEBHOOK_SECRET`, real runner deployment, and the actual Docker path problem.
- README is more honest and correctly describes the runners as a local proof, but these conflicting sources make deployment unsafe.

## What is already solid

- Server actions consistently resolve the current actor and enforce teacher/student roles.
- Classroom ownership and active student membership checks are implemented server-side.
- Student onboarding avoids unsafe email-based identity linking and uses serializable transactions.
- Submission attempts, result snapshots, review revisions, and event sequencing are modeled with useful uniqueness constraints.
- Runner containers have meaningful isolation controls and loopback-only exposure.
- Hidden-test visibility is separated in the student result UI.
- TypeScript is clean and all 228 unit tests pass.
- The landing hero is visually strong and responsive; the desktop sign-in layout is clear once Clerk loads.

## Recommended order of work

1. Bootstrap and verify one production teacher identity, configure Clerk production keys/webhook, then complete a real teacher/student browser acceptance journey.
2. Replace the single-flight runners with a durable, capacity-tested execution service or explicitly scope the launch to a very small supervised pilot.
3. Repair the Docker/release architecture and make CI run lint, migrations, unit, integration, Clerk-aware E2E, runner acceptance, build, and vulnerability checks against ephemeral infrastructure.
4. Wire real rate limits; strengthen join codes; add CSP; decide the AI privacy/consent model; stop automatic external AI calls on page render.
5. Add backups, restore drills, monitoring, alerting, retention, incident response, and admin/support controls.
6. Remove visible demo/sample claims, fix mobile sign-in order and contrast, consolidate TRACE branding, and clean the repository into a reproducible release commit.

Only after those six groups are complete should this be described as production-ready for a class.
