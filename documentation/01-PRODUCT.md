# Labrix product

## Purpose

Labrix is a teacher-first, process-aware coding lab platform that captures the student’s coding journey and converts it into actionable evidence, feedback, and viva guidance for teachers.

Pulse, CodePulse, and CodeClass are legacy names. Labrix is the only active product name.

## Core workflow

**Classroom → Practical → Coding Session → Run/Feedback → Submission → Evidence → Teacher Review**

- A teacher owns a classroom, publishes a practical, chooses languages, adds tests, and sets an optional deadline.
- A student opens the practical, works in a persisted coding session, receives bounded run feedback, and creates an immutable submission attempt.
- Labrix derives measurable process signals and presents evidence with context.
- A teacher reviews the source, result snapshot, process evidence, and AI-assisted viva prompts, then exercises human judgment.

## Product principles

- **Teacher-first:** optimize for assigning, monitoring, reviewing, and conducting a viva.
- **Evidence, not verdicts:** unusual patterns are prompts for review, never proof of misconduct.
- **Transparent student experience:** do not secretly record invasive data or automatically block copy/paste.
- **Deterministic before probabilistic:** compute measurable facts with rules; use AI to explain or draft.
- **Attempt integrity:** preserve each submitted attempt and its relevant snapshots; never mutate history in place.
- **Safe execution:** untrusted source runs only in an isolated execution system, never in the web process.
- **Narrow MVP:** prove the classroom-to-review loop before adding broad analytics or integrations.

## Feature status vocabulary

- **Implemented:** backed by repository behavior and its intended persistence boundary.
- **Partial:** real code exists, but the user outcome or boundary is incomplete.
- **Mock:** demonstrable behavior backed only by deterministic demo/client state.
- **Planned:** intended product behavior with no working implementation yet.
- **Out of scope:** deliberately excluded from the MVP.

The current feature-by-feature classification is in `documentation/02-MVP.md`.

## Success for the first pilot

- A teacher can create and publish one practical without developer intervention.
- A student can resume a draft, run through an isolated boundary, and submit without losing work.
- Every attempt remains reviewable with the exact submitted source and result snapshot.
- Evidence is understandable, attributable, and neutrally worded.
- A teacher can use implementation-specific viva prompts and record their own conclusion outside any automated guilt score.
