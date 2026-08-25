# TRACE product audit — student and teacher points of view

Tested 25 August 2026 against the isolated local demo database in the in-app browser. The audit exercised the teacher dashboard, review queue, submission review, student dashboard, class list, coding workspace, test run, submission history, and feedback navigation.

## Verdict

TRACE has a strong information architecture and a polished, consistent visual system. Both roles can quickly understand the core workflow. It is not ready for a credible classroom demo yet because four issues undermine trust: simulated runs can report success for incomplete code, test results are visually covered by the hint panel, generated teacher guidance contradicts the source code, and demo/test records pollute real-looking class lists.

## Highest-impact findings

### Critical

1. **An incomplete starter program passes every visible test in simulated mode.** In the Balanced Brackets workspace, the untouched C++ starter contains only imports and an empty `main`, yet Run reports `All visible tests passed` and `2 / 2 passed`. The simulation label is visible in the DOM, but the success outcome still tells the student that incorrect work is correct.

2. **Run feedback is covered by the hint panel.** After Run, the visible workspace is unchanged: the full-width `Instructor Permission Required` panel occupies the same lower area where the Results panel is laid out. The success state exists semantically but is not visible in the accepted screenshot. A student can click Run and receive no visible confirmation or explanation.

3. **Teacher assistance invents facts and recommends misleading feedback.** For Diya's five-line Java submission with a missing semicolon and no implemented algorithm, the oral-defense assistant asks about a `Custom Class Object`, a `main logic routine`, loop invariants, and O(N) complexity, then proposes `Strong implementation`. For Aarav's hash-map solution, the same assistant calls an intended O(n) approach O(N²), while the published human feedback correctly calls it O(n). This is unsafe as grading support.

### High

4. **Test and personal fixtures are exposed as normal classes.** Both the teacher filter and student class list include multiple `Join flow verification <timestamp>` classrooms plus `TANISHK BODANI`. The seeded DSA class is pushed below these entries. This makes the product look contaminated and can confuse which class is authoritative.

5. **Overdue work is presented as new/in progress.** On 25 August, Balanced Brackets still shows `New Practical Assigned`, `In progress`, and a due date of 15 August without an overdue label, late-submission policy, or warning beside the enabled Submit action.

6. **Student identity changes across the demo journey.** The student dashboard and class list label `Dr. Meera Sharma` as Student; opening the workspace changes the identity to `Aarav Mehta`. This is especially confusing in a role-preview feature intended for demonstrations.

7. **Student feedback navigation drops into the teacher review surface in demo mode.** From the student submission history, opening a published attempt lands on a page headed `Submission review` with teacher fast-grader navigation and marks controls. The product documentation says role preview is not authentication, so this does not establish a production authorization defect, but it is a serious demo-flow failure.

### Medium

8. **Completed onboarding crowds out teacher work.** The setup guide is marked complete but consumes most of the first dashboard viewport. It is dismissible and properly labelled, yet should collapse automatically after completion.

9. **Secondary text is difficult to read.** Timestamps, metadata, helper text, and inactive navigation use very dark grey at small sizes on a black background. Contrast needs measurement in code, but the screenshots show a clear legibility risk.

10. **The teacher review detail is cognitively heavy.** Telemetry, code, tests, similarity, process evidence, viva questions, and grading controls compete in one long page. The fast-grader header is useful, but teachers need progressive disclosure and a compact evidence summary before the deeper panels.

## What works well

- Teacher dashboard puts pending reviews and urgent work first.
- Review filters, counts, search, result status, and attempt metadata are clear.
- Teacher review preserves source, test evidence, attempt numbers, and published feedback history.
- Student dashboard has a strong single-primary-task hierarchy.
- Workspace clearly separates problem, code, visible tests, hidden-test disclosure, run, and submit.
- Autosave status, language choice, attempt numbering, and instructor-controlled hints are visible.
- Student submission history clearly distinguishes test result, review state, and marks.
- DOM structure includes headings, regions, labelled controls, progress bars, semantic status messages, and descriptive link names.

## Tested steps and health

1. **Teacher dashboard — Needs polish.** Core priorities are clear; completed onboarding and fixture names dominate the first screen.
2. **Teacher review queue — Mostly healthy.** Filtering and scanability are strong; class data is polluted by test fixtures.
3. **Teacher submission review — High risk.** Evidence is rich, but generated grading assistance contradicts the actual code.
4. **Student dashboard — Needs correction.** Primary work is obvious; overdue status and preview identity are wrong.
5. **Student class list — High friction.** Valid class content works, but multiple test classrooms bury it.
6. **Student coding workspace — Critical failure.** Layout is strong until Run; incomplete code passes and visible feedback is covered.
7. **Student submission history — Healthy.** Attempts, results, feedback state, and marks are easy to scan.
8. **Student feedback detail — Demo blocker.** Navigation resolves to the teacher grading surface under role preview.

## Recommended fix order

1. Make simulated execution deterministic but code-sensitive, or disable Run/Submit success claims unless a real runner is available.
2. Fix the workspace grid so Results and Hints never occupy the same area; move focus or scroll to Results after Run.
3. Remove or quarantine generated viva/feedback content until it is validated against parsed source and execution evidence; never call a compilation failure a strong implementation.
4. Reset and isolate demo fixtures so only the curated teacher and student scenarios appear.
5. Add overdue and late-submission states, including teacher policy text next to Submit.
6. Make role-preview identity and role-specific detail routes consistent from end to end.
7. Collapse completed onboarding and simplify the teacher review page with progressive disclosure.
8. Measure and raise contrast for secondary text and inactive controls.

## Accessibility evidence limits

Screenshots and DOM inspection support the hierarchy, labelling, contrast-risk, and hidden-results findings. Full WCAG conformance was not tested. Browser-level focus movement could not be reliably observed in this run, so keyboard order, visible focus, screen-reader announcements, zoom/reflow, Monaco keyboard trapping, and mobile behavior still require dedicated verification.

## Evidence

- `audit-current/01-teacher-dashboard.png`
- `audit-current/02-teacher-review-queue.png`
- `audit-current/03-teacher-review-detail.png`
- `audit-current/04-teacher-feedback-assistant.png`
- `audit-current/05-student-dashboard.png`
- `audit-current/06-student-workspace.png`
- `audit-current/07-student-run-result.png`
- `audit-current/08-student-nav-role-leak.png`
- `audit-current/09-student-feedback-route.png`
- `audit-current/10-student-classes.png`
