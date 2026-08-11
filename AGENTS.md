# Codex implementation rules

## Read before implementation

Before changing product behavior, read:

1. `README.md`
2. `docs/01-PRODUCT.md`
3. `docs/02-MVP.md`
4. `docs/03-USER-FLOWS.md`
5. `docs/04-ARCHITECTURE.md`
6. `docs/05-AI-EVIDENCE-SYSTEM.md`
7. `docs/06-ROADMAP.md`
8. `docs/07-DECISIONS.md`
9. `CONTRIBUTING.md`
10. `docs/08-VERIFICATION.md`

Then inspect the relevant routes, Prisma schema and migrations, authorization boundary, execution provider, tests, and current working-tree status. Repository evidence overrides stale prose; update the prose when behavior changes.

## Product invariants

- Labrix is a teacher-first coding lab platform, not a generic online compiler. Pulse, CodePulse, and CodeClass are legacy names.
- Preserve: Classroom → Practical → Coding Session → Run/Feedback → Submission → Evidence → Teacher Review.
- Evidence supports teacher judgment; it never declares a student guilty or labels behavior as cheating.
- Do not automatically block copy/paste. Capture proportionate metadata only when the product policy permits it.
- Prefer deterministic rules for measurable signals. Use AI for explanation, summaries, feedback drafting, and implementation-specific viva generation.
- Persist student drafts. Treat every submission attempt as immutable.
- Keep the MVP narrow. Screen recording, webcam monitoring, gamification, mobile coding, and cross-institution plagiarism are out of scope.
- Use **Passed all provided tests**, not **Accepted**, for visible-test success.

## Engineering constraints

- Preserve the current Next.js, React, TypeScript, Prisma/PostgreSQL, Monaco, Zod, Vitest, and Playwright stack unless an explicit decision changes it.
- Use strict TypeScript and validate external input with Zod or an equivalent explicit boundary.
- Enforce authentication, classroom membership, role, ownership, and resource access on the server. Route visibility and the demo role selector are not authorization.
- Keep presentation, domain rules, data access, evidence analysis, AI adapters, and execution infrastructure separate.
- Never execute untrusted student code inside the Next.js application process. Production execution must use an isolated provider or sandbox with time, memory, process, filesystem, and network controls.
- Do not send raw source or student identity to an AI provider without an approved data-handling decision. AI output is advisory and must retain provenance.
- Preserve unrelated user changes. Add migrations; do not rewrite migration history that may have been applied.
- Do not expand scope silently. If a task requires a new feature, provider, data category, or product policy, stop and request a decision or record an explicit proposal.

## Testing expectations

- Add or update unit tests for domain rules, validation, evidence-signal calculations, and immutable-attempt behavior.
- Add integration tests for Prisma transactions, persistence, and server-side authorization when those boundaries change.
- Add or update Playwright coverage for behavior visible in the core teacher/student workflow.
- Test failure, empty, loading, deadline, retry, and unauthorized states relevant to the change.
- Run `npm run lint`, `npm run typecheck`, and unit-only `npm test`. Database-backed integration tests must use `npm run test:integration` with an explicitly confirmed disposable database; full Playwright must use the same isolated workflow. Use `npm run test:acceptance:read-only` when a non-mutating route smoke check is sufficient. Run `npm run build` for routing, server, dependency, or deployment-sensitive changes. See `docs/08-VERIFICATION.md`.
- Never describe mock execution as real language execution.

## Definition of done

A change is done only when:

- acceptance criteria are met without weakening product invariants;
- authorization and isolation boundaries are enforced where applicable;
- persisted data has a reviewed migration and safe lifecycle;
- tests cover the changed behavior and required checks pass;
- accessible loading, empty, error, and success states are handled;
- documentation and status labels are updated when behavior changes;
- the handoff states limitations, manual verification, and any unresolved decisions;
- the other team member has reviewed the pull request.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
