# AI and evidence system

This system is **planned**. No evidence capture, signal calculation, AI integration, or viva generation is implemented in the current repository.

## Purpose and boundary

Pulse should help a teacher understand a coding process and decide what to inspect or ask. It must not infer guilt, produce a cheating verdict, or make an academic decision automatically.

Copy/paste remains available. A paste can be ordinary and legitimate; at most, approved metadata becomes one contextual fact among many.

## Lightweight evidence for the MVP

Subject to an approved privacy and retention policy, capture only events needed to reconstruct a useful process summary:

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

