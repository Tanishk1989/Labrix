# TRACE professor demonstration

> This walkthrough uses a deterministic, fictional semester scenario. Seeded attempts and feedback are sample records for evaluation. The reliable default uses a clearly labeled simulated execution provider; real Java/C++ execution is an optional Docker-backed enhancement.

## Opening

“TRACE is a teacher-first coding lab platform. It connects practical authoring, real code execution, immutable attempts, progress evidence, and teacher feedback in one workflow.”

## Before the demonstration

1. Run `npm.cmd run demo:fresh`. This starts the isolated local PostgreSQL instance, fully resets only that loopback demo database, restores the deterministic scenario, and starts TRACE with the disclosed simulated execution provider.
2. Open `http://127.0.0.1:3000/dashboard`.
3. Clear this tab’s session storage only if the temporary role preview is stale.
4. Confirm the dashboard loads, then choose **Teacher** in **Demo preview**.

Docker is not required for this default presentation path. If Docker Desktop and both pinned runner images are available, use the optional `demo:real` path described below to demonstrate real Java and C++ execution.

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
4. Return to **Array Sum** if you want a clean execution demonstration. Paste or type a complete solution, click **Run**, and point out the execution-mode disclosure. The default demo is explicitly simulated; `demo:real` identifies the C++ or Java Docker runner instead.
5. Submission is optional during a short evaluation. If submitted, point out the new immutable attempt number and persisted-review link.

## Teacher result

1. Switch **Demo preview** back to **Teacher** and open the review queue.
2. A newly created submission appears alongside the seeded history. Open it to show the exact source/result snapshots, run count, and ordered process timeline.

## Closing

“Unlike a generic online compiler, TRACE preserves the teaching workflow: classroom, practical, coding session, execution feedback, immutable submission, evidence, and teacher review.”

## Recovery

- If the database is temporarily unavailable, run `npm.cmd run demo:check`. It reports only a safe readiness message.
- If the demo seed is missing or stale, run `npm.cmd run demo:reset`; it refuses non-loopback database hosts.
- For the cleanest rehearsal or presentation start, use `npm.cmd run demo:fresh`.
- If the role preview is stale, clear the tab’s session storage or use a private window. Use `demo:reset` to restore the curated scenario.
- `npm.cmd run demo:real` checks the local database, Docker images, and both language workers; builds the optimized application; and serves it on loopback without the Next.js development indicator. It prepares the isolated demo database but does not replace the reliable simulated fallback when Docker is unavailable.
- Use `npm.cmd run demo` only when intentionally demonstrating the clearly labeled simulated execution fallback.
