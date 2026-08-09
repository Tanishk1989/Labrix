# Labrix professor demonstration

> Prototype script: this demonstrates Labrix’s current demo UI, not the completed MVP. Any path still documented as mock in [02-MVP.md](02-MVP.md) must not be presented as production behavior.

## Opening

“Labrix is a teacher-first coding lab platform. It combines classroom task management with a focused coding workspace and lightweight process evidence.”

## Before the demonstration

1. Run `npm.cmd run demo:reset` to restore the deterministic demo database.
2. Clear this browser tab’s session storage, or open a private window, only if the temporary role preview is stale. Persisted attempts are reset by `demo:reset`.
3. Run `npm.cmd run demo` and open `http://127.0.0.1:3000/classes`.
4. Confirm My Classes loads, then choose **Teacher** in the compact **Demo preview** control.

## Teacher workflow

1. At `/classes`, open **DSA Practical Lab**.
2. Point out **Array Sum**, its future deadline, and the classroom progress summary.
3. Open **View student progress** at `/classes/dsa-2026/students`. Immediately after reset, all three students have no persisted submission.
4. Optionally open `/classes/dsa-2026/tasks/new` to show the practical-authoring form.

## Student workflow

1. Switch the sidebar **Demo preview** control to **Student** and open `/classes/dsa-2026`.
2. Open **Array Sum** with **Start practical**. The workspace route is `/tasks/two-sum`.
3. Show the problem statement, visible examples, constraints, language selector, and editor.
4. Click **Run** with the initial starter comment: it intentionally reports one failed visible test.
5. Delete `fail_test` from the starter comment, then click **Run** again. Both visible tests pass.
6. Click **Submit**. Point out the immutable attempt number, timestamp, simulated result, and persisted-review link.

## Teacher result

1. Switch **Demo preview** back to **Teacher** and open `/classes/dsa-2026/students`.
2. Aarav Mehta is now marked **Submitted**. Open **Review** using the generated persisted-submission URL and show the source/result snapshots, run count, and ordered foundation timeline.

## Closing

“Unlike a generic online compiler, Labrix manages the practical workflow from task creation through student submission and teacher review.”

## Recovery

- If the database is temporarily unavailable, run `npm.cmd run demo:check`. It reports only a safe readiness message.
- If the demo seed is missing or stale, run `npm.cmd run demo:reset`; it refuses hosts whose name appears to be production.
- If the role preview is stale, clear the tab’s session storage or use a private window. Use `demo:reset` to remove persisted demo attempts.
- `npm.cmd run demo` performs a readiness check before starting Next.js. It does not migrate or reset the database.
