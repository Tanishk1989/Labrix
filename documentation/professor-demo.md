# TRACE professor demonstration

> This walkthrough uses a deterministic, fictional semester scenario. Seeded attempts and feedback are sample records for evaluation; new **Run** actions use local Docker workers when the app is started with `demo:real`.

## Opening

“TRACE is a teacher-first coding lab platform. It connects practical authoring, real code execution, immutable attempts, progress evidence, and teacher feedback in one workflow.”

## Before the demonstration

1. Confirm Docker Desktop is running.
2. Run `npm.cmd run demo:reset` to restore the deterministic local demo database. The command refuses non-loopback database hosts.
3. Run `npm.cmd run demo:real`. It performs a database readiness check and optimized build before opening the server. Then open `http://127.0.0.1:3000/dashboard`.
4. Clear this tab’s session storage only if the temporary role preview is stale.
5. Confirm the dashboard loads, then choose **Teacher** in **Demo preview**.

The fictional class is **BTech CSE · Semester III · Section A**, taught by **Dr. Meera Sharma**, with three students and three practicals. The compact roster is intentional: each student represents a distinct state that remains legible during a live review.

## Teacher workflow

1. Start at `/dashboard`. Point out the real review count, current **Balanced Brackets** context, deadline attention, and immutable recent activity.
2. At `/practicals`, show two published practicals and the **Campus Route Planner** draft. Do not describe the draft as available to students.
3. Open **DSA Practical Lab**, then its student progress view. The scenario shows:
   - Aarav Mehta: a failed **Array Sum** first attempt, teacher feedback, and a successful resubmission; he also has an active **Balanced Brackets** draft.
   - Diya Sharma: a Java compilation-error submission awaiting review and a completed **Balanced Brackets** submission with private draft feedback.
   - Kabir Singh: no submission yet, making the missing-work state visible.
4. Open `/submissions?review=NEW` and review Diya’s compilation failure. Explain that execution evidence informs, but does not replace, teacher judgment.
5. Open the reviewed Aarav resubmission to show published feedback, 10/10 marks, hidden-test separation, and the ordered process timeline.

## Student workflow

1. Switch **Demo preview** to **Student** and open `/classes/dsa-2026`.
2. Open **Balanced Brackets** and resume Aarav’s saved C++ draft to demonstrate draft persistence.
3. Show the problem statement, visible tests, hidden-test disclosure, constraints, language selector, and editor.
4. Return to **Array Sum** if you want a clean live execution. Paste or type a complete solution, click **Run**, and point out the **C++ Docker runner** or **Java Docker runner** disclosure.
5. Submission is optional during a short evaluation. If submitted, point out the new immutable attempt number and persisted-review link.

## Teacher result

1. Switch **Demo preview** back to **Teacher** and open the review queue.
2. A newly created submission appears alongside the seeded history. Open it to show the exact source/result snapshots, run count, and ordered process timeline.

## Closing

“Unlike a generic online compiler, TRACE preserves the teaching workflow: classroom, practical, coding session, execution feedback, immutable submission, evidence, and teacher review.”

## Recovery

- If the database is temporarily unavailable, run `npm.cmd run demo:check`. It reports only a safe readiness message.
- If the demo seed is missing or stale, run `npm.cmd run demo:reset`; it refuses non-loopback database hosts.
- If the role preview is stale, clear the tab’s session storage or use a private window. Use `demo:reset` to restore the curated scenario.
- `npm.cmd run demo:real` checks the local database, Docker images, and both language workers; builds the optimized application; and serves it on loopback without the Next.js development indicator. It does not migrate or reset the database.
- Use `npm.cmd run demo` only when intentionally demonstrating the clearly labeled simulated execution fallback.
