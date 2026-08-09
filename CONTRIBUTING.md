# Contributing

Labrix uses a lightweight two-person workflow.

1. **Issue or task:** describe the user problem, scope, product-status impact, dependencies, and exclusions. Link any unresolved decision in `docs/07-DECISIONS.md`.
2. **Acceptance criteria:** write observable outcomes before implementation, including authorization, persistence, evidence wording, failure states, and test expectations where relevant.
3. **Feature branch:** create a short-lived branch such as `feature/persistent-drafts` or `fix/classroom-authorization`. Keep unrelated work out of the branch.
4. **Implementation:** preserve the documented product invariants and current stack. Do not silently add scope or represent planned/mock behavior as implemented.
5. **Required tests:** run `npm run lint`, `npm run typecheck`, and `npm test`; also run relevant integration tests and `npm run test:e2e` for changed user flows. Run `npm run build` for routing, server, dependency, or deployment-sensitive work.
6. **Pull request:** summarize the outcome, acceptance criteria, data flow, migration or security implications, tests run, screenshots when useful, known limitations, and follow-up work.
7. **Review:** the other team member reviews the pull request. The author resolves or explicitly records every blocking comment before merge.
8. **Documentation:** update README/status tables, architecture, flows, decisions, and operational notes whenever behavior, data, scope, or constraints change.

Prefer small pull requests that deliver one coherent vertical slice. Do not combine opportunistic redesigns or cleanup with feature work unless the task explicitly includes them.
