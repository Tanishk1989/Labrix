"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useRef } from "react";
import type { PersistedSubmission, StudentWorkspace } from "@/server/attempts/service";
import { ExecutionResultDetails } from "./student-run-results";
import { createStudentSubmissionVerdictViewModel } from "./submission-verdict-view-model";

type VisibleWorkspaceTest = StudentWorkspace["task"]["tests"][number];

export function StudentSubmissionVerdict({
  submission,
  taskId,
  visibleTests,
}: {
  submission: PersistedSubmission;
  taskId: string;
  visibleTests: VisibleWorkspaceTest[];
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const verdict = createStudentSubmissionVerdictViewModel(submission, visibleTests);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="workspace-submission-verdict">
      <div className="workspace-submission-recorded">
        <CheckCircle2 size={18} aria-hidden="true" />
        <div>
          <h3 ref={headingRef} tabIndex={-1}>Your submission was recorded</h3>
          <p>
            Attempt #{submission.attemptNumber} is permanently saved in your submission history. This workspace is now read only.
          </p>
        </div>
      </div>

      <dl className="workspace-submission-summary">
        <div>
          <dt>Submission status</dt>
          <dd>Recorded</dd>
        </div>
        <div>
          <dt>Visible tests</dt>
          <dd>{verdict.visibleSummary}</dd>
        </div>
        {verdict.privateSummary ? (
          <div>
            <dt>Hidden tests</dt>
            <dd>{verdict.privateSummary}</dd>
          </div>
        ) : null}
        {verdict.automatedScore ? (
          <div>
            <dt>Automated test score</dt>
            <dd>{verdict.automatedScore}</dd>
          </div>
        ) : null}
        <div>
          <dt>Review status</dt>
          <dd>{verdict.reviewStatus}</dd>
        </div>
      </dl>

      <p className="workspace-submission-score-note">
        {verdict.automatedScore
          ? "The automated score is separate from teacher-awarded marks. Hidden test details remain hidden."
          : "No automated score was calculated because this practical has no tests. Teacher review remains available."}
      </p>

      <ExecutionResultDetails result={verdict.result} announceOutcome={false} />

      <div className="workspace-submission-actions">
        <Link href={`/submissions/${submission.id}`} className="button">View submission</Link>
        <Link href={`/practicals/${taskId}`} className="button-secondary">Return to practical</Link>
      </div>
    </div>
  );
}
