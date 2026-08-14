# AI and evidence system

Five foundation events are **implemented**: `SESSION_STARTED`, `DRAFT_SAVED`, `RUN_REQUESTED`, `RUN_COMPLETED`, and `SUBMISSION_CREATED`. Phase AI-0 implements versioned deterministic submission facts, Phase AI-1 maps available facts to teacher-only review priority, Phase AI-2 adds a transient review/viva draft, and Phase AI-3 adds an explicit prototype Groq option while retaining the fake default. Institutional AI governance and additional event fields remain **planned**.

## Purpose and boundary

Labrix should help a teacher understand a coding process and decide what to inspect or ask. It must not infer guilt, produce a cheating verdict, or make an academic decision automatically.

Copy/paste remains available. A paste can be ordinary and legitimate; at most, approved metadata becomes one contextual fact among many.

## Lightweight evidence for the MVP

The current slice captures only server timestamps, event order, session ID, and relevant run/submission IDs. Later event expansion remains subject to an approved privacy and retention policy:

- coding-session start/resume/end and draft-save checkpoints;
- language changes and coarse edit counts or size deltas;
- paste event timestamp and character/line count, not clipboard contents as a separate payload;
- run timestamp, result category, duration, and test summary;
- submission timestamp and the immutable attempt reference.

Do not collect screen video, webcam data, keystroke biometrics, unrelated browsing activity, or hidden device surveillance.

## Deterministic signals

Signals must be versioned, reproducible, explainable, and linked to their underlying facts. Initial candidates are:

- time from session start to first run and to submission;
- number and spacing of runs;
- proportion of the final source introduced by large paste events, using a documented approximation;
- magnitude of source change between the last run and submission;
- whether the submitted source had a matching successful run snapshot;
- abrupt source-size changes or a very short active session, using teacher-visible thresholds.

Phase AI-0 implements the non-threshold facts supported by current records: run and event counts, overall/visible/hidden test summaries, stored suggested score, timing status, practical version, execution mode, session-to-submission time, time to first run, source comparison with the latest successful pre-submission run, and whether a later draft-save event exists. The submit-time execution is excluded from that run comparison. Large source-size jumps are explicitly unavailable because `CodeEvent` does not store size deltas and `Draft` retains no revision history.

Phase AI-1 applies these versioned rules only to available facts:

- no pre-submission run, a session shorter than five minutes, a submitted source mismatch with the latest successful pre-submission run, a later draft save, or a stored suggested score of at least 8.0/10 with one or more hidden failures each adds one neutral reason;
- zero reasons maps to `LOW_ATTENTION`, one to `REVIEW_RECOMMENDED`, and two or more to `HIGH_REVIEW_PRIORITY`;
- the exact five-minute boundary is not short, the score boundary is inclusive, and unavailable or unsupported source-jump facts never add a reason.

The category is an inspection-order aid, not a probability or student ranking. It is shown only to the classroom-owning teacher on submission detail and as a compact category/reason count in the review queue. Student DTOs contain neither the facts nor the signal.

Display neutral language such as “72% of the final source appeared after one large paste event” or “No matching successful run was recorded.” Never display “cheated,” “plagiarized,” “suspicious student,” or a guilt probability.

Thresholds should guide attention, not rank students morally. Teachers must be able to inspect definitions and facts, and later policy should allow acknowledgement or contextual notes.

## Appropriate AI uses

- Explain deterministic signals in plain language without adding unsupported claims.
- Summarize the event timeline and implementation approach.
- Draft constructive teacher feedback for review and editing.
- Generate viva questions grounded in the submitted implementation, its trade-offs, and observed changes.

AI must not calculate facts that deterministic code can calculate, decide misconduct, assign sanctions, or silently alter grades. Generated output must be labeled, retain model/prompt/context provenance, and be discardable. A teacher remains responsible for any feedback or viva use.

## Minimal viva output

For each immutable attempt, generate a small set of questions covering:

- explanation of a concrete function, data structure, or control-flow choice in that source;
- complexity and edge cases;
- one modification or debugging scenario;
- one question tied cautiously to the process evidence, such as asking the student to explain a large late change.

Questions should test understanding, not accuse. Do not reveal hidden policy thresholds to students through generated wording.

## Safety and quality requirements

- Minimize and redact context before any external AI call; use stable internal identifiers rather than direct identity where possible.
- Define provider, region, retention, training-use, access, and deletion policy before production use.
- Treat source code and student records as sensitive data.
- Validate structured AI responses and tolerate provider failure.
- Keep deterministic facts visually distinct from generated interpretation.
- Test prompt injection from source/comments and require the model to treat source as data, not instructions.
- Evaluate grounding, neutrality, usefulness, and false implication before pilot release.

## Phase AI-2 v1 review brief

The owning teacher explicitly requests one brief for one immutable attempt. The action re-authenticates the teacher and reuses the classroom-owner-scoped submission service. It does not accept source, facts, identity, result data, marks, or feedback from the browser.

The provider input contains only practical title/instructions, language, immutable submitted source, overall/visible/hidden aggregate result summaries, Phase AI-0 facts, Phase AI-1 signal, timing status, and practical version. It excludes student name/email, classroom identity, raw events, test identifiers, hidden inputs, hidden expected output, hidden actual output, existing teacher feedback, and marks.

The structured output contains:

1. approach summary;
2. likely bugs or edge cases;
3. an explanation grounded in deterministic evidence;
4. exactly three implementation-specific viva questions;
5. expected-answer bullets for every question;
6. one small modification task;
7. a constructive feedback draft.

Every field is editable and the entire draft is discardable. Generation does not persist output, modify marks, save a teacher review, or publish feedback. Provenance identifies the provider, model, prompt version, generation time, and `persisted: false`.

`FakeAIReviewBriefProvider` remains the deterministic in-process default and the only provider used in tests. It makes no external API call, strips comments before source-structure heuristics, and never treats submitted source or practical text as instructions.

Phase AI-3 permits explicit `LABRIX_AI_REVIEW_PROVIDER=groq` prototype/demo operation only when a server-side API key and model are also configured. Before dispatch, the adapter reconstructs the allowlisted input and excludes identity, raw events, per-test details, marks, and feedback even if unexpected fields reach the adapter. It sends practical text and submitted source as explicitly untrusted data, requests JSON-schema output, applies a bounded timeout and response size, and passes parsed model JSON through the existing Zod contract. It logs none of the key, prompt, source, request body, or raw response. Groq is not the accepted final institutional provider, and Labrix makes no enterprise residency, retention, or training-use guarantee for this prototype; those policies and production evaluation remain unresolved under D-013.
