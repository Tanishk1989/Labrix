# Contributing

Labrix uses a lightweight two-person workflow.

1. **Issue or task:** describe the user problem, scope, product-status impact, dependencies, and exclusions. Link any unresolved decision in `documentation/07-DECISIONS.md`.
2. **Review existing behavior:** read relevant user flows, architecture decisions, and current tests before changing code.
3. **Authorization & isolation:** enforce ownership, role, membership, and account status on the server. Code execution must not run inside the Next.js process.
4. **Data preservation:** treat submitted attempts as immutable. Persist student draft state.
5. **Required tests:** run `npm run lint`, `npm run typecheck`, and unit-only `npm test`. Run relevant serial integration tests and full Playwright only with the disposable-database guard described in `documentation/08-VERIFICATION.md`; use `npm run test:acceptance:read-only` for a safe seeded-route smoke check. Run `npm run build` for routing, server, dependency, or deployment-sensitive work.
6. **Pull request:** summarize the outcome, acceptance criteria, data flow, migration or security implications, tests run, screenshots when useful, known limitations, and follow-up work.
7. **Review:** the other team member reviews the pull request. The author resolves or explicitly records every blocking comment before merge.
8. **Documentation:** update README/status tables, architecture, flows, decisions, and operational notes whenever behavior, data, scope, or constraints change.

Prefer small pull requests that deliver one coherent vertical slice. Do not combine opportunistic redesigns or cleanup with feature work unless the task explicitly includes them.
