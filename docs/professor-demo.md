# CodeClass professor demonstration

> Legacy prototype script: this demonstrates the current mock CodeClass-branded UI, not the completed Pulse MVP. Execution, submissions, progress, and review in this journey use deterministic client/session state. See [02-MVP.md](02-MVP.md).

## Opening

“CodeClass is a coding practical classroom platform. It combines classroom task management with a focused coding workspace and lightweight execution feedback.”

## Before the demonstration

1. Run `npm.cmd run demo:reset` to restore the deterministic demo database.
2. Clear this browser tab’s session storage, or open a new private window, to reset the temporary role and submission state.
3. Run `npm.cmd run demo` and open `http://127.0.0.1:3000/classes`.
4. Confirm My Classes loads, then choose **Teacher** in the compact **Demo preview** control.

## Teacher workflow

1. At `/classes`, open **DSA Practical Lab**.
2. Point out **Array Sum**, its future deadline, and the classroom progress summary.
3. Open **View student progress** at `/classes/dsa-2026/students`. This shows the seeded three-student state: one not started, one in progress, and one submitted.
4. Optionally open `/classes/dsa-2026/tasks/new` to show the practical-authoring form.

## Student workflow

1. Switch the sidebar **Demo preview** control to **Student** and open `/classes/dsa-2026`.
2. Open **Array Sum** with **Start practical**. The workspace route is `/tasks/two-sum`.
3. Show the problem statement, visible examples, constraints, language selector, and editor.
4. Click **Run** with the initial starter comment: it intentionally reports one failed visible test.
5. Delete `fail_test` from the starter comment, then click **Run** again. Both visible tests pass.
6. Click **Submit**. Point out the **Submitted successfully** panel with timestamp, language, and test summary.

## Teacher result

1. Switch **Demo preview** back to **Teacher** and open `/classes/dsa-2026/students`.
2. Aarav Mehta is now marked **Submitted**. Open **Review** to view the latest submission at `/submissions/sub-1`.

## Closing

“Unlike a generic online compiler, CodeClass manages the entire practical workflow from task creation to student submission and teacher tracking.”

## Recovery

- If the database is temporarily unavailable, run `npm.cmd run demo:check`. It reports only a safe readiness message.
- If the demo seed is missing or stale, run `npm.cmd run demo:reset`; it refuses hosts whose name appears to be production.
- If browser demo state is stale, clear the tab’s session storage or use a private window, then repeat the student submission.
- `npm.cmd run demo` performs a readiness check before starting Next.js. It does not migrate or reset the database.
