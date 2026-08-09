"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppShell, getStoredDemoRole } from "@/components/app-shell";
import {
  MetricCard,
  ProgressBar,
  StatusBadge,
} from "@/components/design-system";
import {
  ArchivedClasses,
  JoinCode,
} from "@/components/interactive-design-system";
import { demoClassroom } from "@/data/mock/classroom";
import type { DemoRole, Language } from "@/domain/tasks/models";
import { deriveTaskState, taskStateLabel } from "@/domain/tasks/task-state";
import { MockExecutionProvider } from "@/lib/execution/mock-provider";
import type { ExecutionResult } from "@/lib/execution/provider";
import {
  Braces,
  CalendarClock,
  ChevronRight,
  Plus,
  UsersRound,
} from "lucide-react";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
const provider = new MockExecutionProvider();
const task = demoClassroom.tasks[0];
const demoSubmissionStorageKey = "labrix:legacy-demo-submitted-at";
const taskSchema = z.object({
  title: z.string().min(3),
  deadline: z.string().min(1),
});
type TaskForm = z.infer<typeof taskSchema>;

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {children}
    </section>
  );
}
function StatePill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
      {label}
    </span>
  );
}

export default function DemoApp() {
  const pathname = usePathname() ?? "/";
  const [role, setRole] = useState<DemoRole>("teacher");
  const [source, setSource] = useState(
    "#include <iostream>\nusing namespace std;\n\nint main() {\n  // fail_test — replace this comment with your solution\n  return 0;\n}",
  );
  const [language, setLanguage] = useState<Language>("cpp");
  const [result, setResult] = useState<ExecutionResult>();
  const [isRunning, setIsRunning] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string>();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRole(getStoredDemoRole());
      setSubmittedAt(window.sessionStorage.getItem(demoSubmissionStorageKey) ?? undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const studentState = deriveTaskState({
    hasDraft: source.length > 0,
    submittedAt,
    deadline: task.deadline,
    now: new Date("2026-08-06T12:00:00.000Z"),
  });
  const completion = useMemo(
    () => ({
      submitted:
        demoClassroom.students.filter((student) => student.submission).length +
        (submittedAt ? 1 : 0),
    }),
    [submittedAt],
  );
  async function execute(submit: boolean) {
    setIsRunning(true);
    const next = await provider.execute({
      language,
      sourceCode: source,
      tests: task.tests,
    });
    setResult(next);
    if (submit) {
      const timestamp = new Date().toISOString();
      window.sessionStorage.setItem(demoSubmissionStorageKey, timestamp);
      setSubmittedAt(timestamp);
    }
    setIsRunning(false);
  }
  let screen: React.ReactNode;
  if (pathname === "/" || pathname === "/classes") screen = <Classes />;
  else if (pathname.endsWith("/tasks/new")) screen = <CreateTask />;
  else if (pathname.endsWith("/students"))
    screen = (
      <Progress
        submitted={completion.submitted}
        submittedAt={submittedAt}
        result={result}
      />
    );
  else if (pathname.startsWith("/tasks/"))
    screen = (
      <Workspace
        language={language}
        setLanguage={setLanguage}
        source={source}
        setSource={(value) => setSource(value ?? "")}
        result={result}
        running={isRunning}
        state={studentState}
        submittedAt={submittedAt}
        run={() => execute(false)}
        submit={() => execute(true)}
      />
    );
  else if (pathname.endsWith("/my-submissions"))
    screen = <MySubmissions submittedAt={submittedAt} result={result} />;
  else if (pathname.startsWith("/submissions/"))
    screen = <SubmissionReview submittedAt={submittedAt} result={result} source={source} language={language} />;
  else if (pathname.endsWith("/tasks"))
    screen = <TaskList role={role} state={studentState} />;
  else
    screen = (
      <ClassroomOverview
        role={role}
        submitted={completion.submitted}
        state={studentState}
      />
    );
  return (
    <AppShell role={role} setRole={setRole}>
      {screen}
    </AppShell>
  );
}

function Classes() {
  const activeTaskCount = demoClassroom.tasks.length;
  const submittedCount = demoClassroom.students.filter(
    (student) => student.submission,
  ).length;
  const pendingCount = demoClassroom.students.length - submittedCount;
  const progress = Math.round(
    (submittedCount / demoClassroom.students.length) * 100,
  );
  return (
    <>
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            My Classes
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Manage your programming classrooms and practical sessions.
          </p>
        </div>
        <button className="button">
          <Plus size={17} aria-hidden="true" />
          Create class
        </button>
      </section>
      <section
        className="mt-8 grid gap-3 sm:grid-cols-3"
        aria-label="Classroom summary"
      >
        <MetricCard label="Active classes" value={1} detail="This semester" />
        <MetricCard
          label="Total students"
          value={demoClassroom.students.length}
          detail="Across active classes"
          tone="emerald"
        />
        <MetricCard
          label="Practicals due soon"
          value={activeTaskCount}
          detail="Within the next 7 days"
          tone="amber"
        />
      </section>
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Active classes
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {activeTaskCount} practical currently in progress.
            </p>
          </div>
          <StatusBadge tone="info">{activeTaskCount} active</StatusBadge>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <article className="classroom-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                  <Braces size={21} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
                    {demoClassroom.subject}
                  </p>
                  <h3 className="mt-1 truncate text-lg font-semibold text-slate-950">
                    {demoClassroom.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {demoClassroom.section}
                  </p>
                </div>
              </div>
              <StatusBadge tone="success">Active</StatusBadge>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3 border-y border-slate-100 py-4">
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <UsersRound size={14} aria-hidden="true" />
                  Students
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {demoClassroom.students.length}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <CalendarClock size={14} aria-hidden="true" />
                  Next deadline
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  12 Aug, 5:00 PM
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--text-muted)]">
                  Active practicals
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  {activeTaskCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Join code</dt>
                <dd className="mt-1">
                  <JoinCode code={demoClassroom.joinCode} />
                </dd>
              </div>
            </dl>
            <div className="mt-5">
              <ProgressBar
                value={progress}
                label="Latest practical completion"
              />
              <div className="mt-3 flex items-center gap-2 text-xs">
                <StatusBadge tone="success">
                  {submittedCount} submitted
                </StatusBadge>
                <StatusBadge tone="warning">{pendingCount} pending</StatusBadge>
              </div>
            </div>
            <Link
              href="/classes/dsa-2026"
              className="mt-6 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Open class <ChevronRight size={16} aria-hidden="true" />
            </Link>
          </article>
        </div>
      </section>
      <ArchivedClasses />
    </>
  );
}

function ClassroomOverview({
  role,
  submitted,
  state,
}: {
  role: DemoRole;
  submitted: number;
  state: ReturnType<typeof deriveTaskState>;
}) {
  return (
    <>
      <p className="text-sm text-slate-500">
        My Classes / {demoClassroom.name}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{demoClassroom.name}</h1>
          <p className="text-slate-500">
            {demoClassroom.section} · Join code{" "}
            <strong>{demoClassroom.joinCode}</strong>
          </p>
        </div>
        {role === "teacher" && (
          <Link href="/classes/dsa-2026/tasks/new" className="button">
            Create practical
          </Link>
        )}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Students</p>
          <p className="mt-1 text-2xl font-semibold">
            {demoClassroom.students.length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Submitted</p>
          <p className="mt-1 text-2xl font-semibold">{submitted}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Current task</p>
          <p className="mt-1 font-semibold">
            {role === "student" ? taskStateLabel[state] : "1 active"}
          </p>
        </Card>
      </div>
      <div className="mt-6">
        <TaskList role={role} state={state} />
      </div>
    </>
  );
}
function TaskList({
  role,
  state,
}: {
  role: DemoRole;
  state: ReturnType<typeof deriveTaskState>;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Practicals</h2>
        {role === "teacher" ? (
          <Link
            href="/classes/dsa-2026/students"
            className="text-sm font-medium text-sky-700"
          >
            View progress
          </Link>
        ) : (
          <Link
            href="/tasks/two-sum/my-submissions"
            className="text-sm font-medium text-sky-700"
          >
            My submissions
          </Link>
        )}
      </div>
      <Link
        href="/tasks/two-sum"
        className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-sky-300"
      >
        <div>
          <p className="font-medium">{task.title}</p>
          <p className="mt-1 text-sm text-slate-500">
            Due 12 Aug, 5:00 PM · C++ or Java
          </p>
        </div>
        <StatePill
          label={role === "student" ? taskStateLabel[state] : "Published"}
        />
      </Link>
    </Card>
  );
}
function CreateTask() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<TaskForm>({
    defaultValues: { title: "", deadline: "2026-08-12T17:00" },
  });
  return (
    <>
      <p className="text-sm text-slate-500">
        {demoClassroom.name} / Create practical
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Create practical</h1>
      <form
        className="mt-6 max-w-2xl space-y-5"
        onSubmit={handleSubmit((values) => taskSchema.parse(values))}
      >
        <Card>
          <label className="block text-sm font-medium">
            Title
            <input
              {...register("title", { required: "A title is required" })}
              className="input mt-2"
              placeholder="e.g. Binary search"
            />
          </label>
          {errors.title && (
            <p className="mt-1 text-sm text-rose-700">{errors.title.message}</p>
          )}
          <label className="mt-4 block text-sm font-medium">
            Deadline
            <input
              type="datetime-local"
              {...register("deadline", { required: "A deadline is required" })}
              className="input mt-2"
            />
          </label>
          <p className="mt-4 text-sm text-slate-500">
            Language: C++ and Java · Visible test cases: 2 (mocked form)
          </p>
        </Card>
        <button className="button" type="submit">
          Save draft
        </button>
        {isSubmitSuccessful && (
          <span className="ml-3 text-sm text-emerald-700">
            Draft saved in demo state.
          </span>
        )}
      </form>
    </>
  );
}
function Workspace({
  language,
  setLanguage,
  source,
  setSource,
  result,
  running,
  state,
  submittedAt,
  run,
  submit,
}: {
  language: Language;
  setLanguage: (v: Language) => void;
  source: string;
  setSource: (v: string | undefined) => void;
  result?: ExecutionResult;
  running: boolean;
  state: ReturnType<typeof deriveTaskState>;
  submittedAt?: string;
  run: () => void;
  submit: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{demoClassroom.name} / Practical</p>
          <h1 className="text-2xl font-semibold">{task.title}</h1>
        </div>
        <StatePill label={taskStateLabel[state]} />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
        <Card>
          <p>{task.description}</p>
          <h2 className="mt-5 font-semibold">Constraints</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
            {task.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
          <p className="mt-5 text-sm font-medium">Deadline: 12 Aug 2099, 5:00 PM</p>
          <h2 className="mt-5 font-semibold">Visible tests</h2>
          {task.tests.map((test) => (
            <div
              className="mt-3 rounded-lg bg-slate-50 p-3 text-sm"
              key={test.id}
            >
              <p className="font-medium">{test.label}</p>
              <pre className="mt-2 whitespace-pre-wrap text-xs">
                Input: {test.input}
                {"\n"}Output: {test.expectedOutput}
              </pre>
            </div>
          ))}
        </Card>
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
            <label className="text-sm">
              Language{" "}
              <select
                className="ml-2 rounded border px-2 py-1"
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value as Language)
                }
              >
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </label>
            <span className="text-xs text-emerald-700">
              Draft autosaved locally
            </span>
          </div>
          <div className="h-[360px]">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : "java"}
              value={source}
              onChange={setSource}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 14 }}
            />
          </div>
          <div className="flex flex-wrap gap-3 border-t p-3">
            <button
              className="button-secondary"
              onClick={run}
              disabled={running}
            >
              {running ? "Running…" : "Run"}
            </button>
            <button className="button" onClick={submit} disabled={running}>
              {running ? "Submitting…" : "Submit"}
            </button>
          </div>
          {result && (
            <div className="border-t p-4">
              <p className="font-medium">
                {result.state === "completed"
                  ? result.passedTests === result.totalTests
                    ? "Passed all provided tests"
                    : `${result.passedTests}/${result.totalTests} provided tests passed`
                  : result.errorText}
              </p>
              {result.testResults.map((testResult) => (
                <div
                  className="mt-2 flex justify-between rounded bg-slate-50 p-2 text-sm"
                  key={testResult.testId}
                >
                  <span>
                    {
                      task.tests.find((test) => test.id === testResult.testId)
                        ?.label
                    }
                  </span>
                  <span
                    className={
                      testResult.passed ? "text-emerald-700" : "text-rose-700"
                    }
                  >
                    {testResult.passed
                      ? "Passed"
                      : `Failed · output: ${testResult.actualOutput}`}
                  </span>
                </div>
              ))}
            </div>
          )}
          {submittedAt && (
            <section className="m-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4" role="status" aria-live="polite">
              <p className="font-semibold text-emerald-900">Submitted successfully</p>
              <p className="mt-1 text-sm text-emerald-800">
                {new Date(submittedAt).toLocaleString()} · {language === "cpp" ? "C++" : "Java"} · {result?.passedTests ?? 0}/{result?.totalTests ?? task.tests.length} visible tests passed
              </p>
              {result?.passedTests === result?.totalTests && <p className="mt-1 text-sm font-medium text-emerald-800">Passed all provided tests</p>}
              <div className="mt-3 flex flex-wrap gap-3">
                <Link href="/classes/dsa-2026" className="text-sm font-semibold text-emerald-800 underline underline-offset-2">Return to classroom</Link>
                <Link href="/submissions/sub-1" className="text-sm font-semibold text-emerald-800 underline underline-offset-2">View latest submission</Link>
              </div>
            </section>
          )}
        </section>
      </div>
    </>
  );
}
function Progress({
  submitted,
  submittedAt,
  result,
}: {
  submitted: number;
  submittedAt?: string;
  result?: ExecutionResult;
}) {
  return (
    <>
      <p className="text-sm text-slate-500">{demoClassroom.name} / Students</p>
      <div className="mt-2 flex justify-between">
        <h1 className="text-2xl font-semibold">Practical progress</h1>
        <span className="text-sm text-slate-500">
          {submitted}/{demoClassroom.students.length} submitted
        </span>
      </div>
      <Card>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="py-3">Student</th>
              <th>Status</th>
              <th>Latest result</th>
              <th>Language</th>
              <th>Last activity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {demoClassroom.students.map((student) => {
              const current =
                student.id === "student-1" && submittedAt
                  ? {
                      passedTests: result?.passedTests ?? 0,
                      totalTests: result?.totalTests ?? task.tests.length,
                    }
                  : student.submission;
              return (
                <tr className="border-t" key={student.id}>
                  <td className="py-3">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                  </td>
                  <td>
                    {current ? (
                      <StatePill label="Submitted" />
                    ) : student.draftExists ? (
                      <StatePill label="In progress" />
                    ) : (
                      <StatePill label="Not started" />
                    )}
                  </td>
                  <td>
                    {current
                      ? `${current.passedTests}/${current.totalTests} tests`
                      : "—"}
                  </td>
                  <td>{current ? (student.id === "student-2" ? "Java" : "C++") : "—"}</td>
                  <td className="text-slate-500">{current ? (student.id === "student-1" && submittedAt ? new Date(submittedAt).toLocaleString() : "6 Aug, 3:00 PM") : "—"}</td>
                  <td>
                    <Link href="/submissions/sub-1" className="text-sky-700">
                      Review
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
function MySubmissions({
  submittedAt,
  result,
}: {
  submittedAt?: string;
  result?: ExecutionResult;
}) {
  return (
    <>
      <h1 className="text-2xl font-semibold">My submissions</h1>
      <Card>
        {submittedAt ? (
          <>
            <p className="font-medium">Latest submission</p>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(submittedAt).toLocaleString()} · {result?.passedTests}/
              {result?.totalTests} provided tests passed
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">No submissions yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Run your solution, then submit when you are ready.
            </p>
            <Link
              className="mt-4 inline-block text-sky-700"
              href="/tasks/two-sum"
            >
              Open practical
            </Link>
          </>
        )}
      </Card>
    </>
  );
}
function SubmissionReview({ submittedAt, result, source, language }: { submittedAt?: string; result?: ExecutionResult; source: string; language: Language }) {
  const student = submittedAt ? "Aarav Mehta" : "Diya Sharma";
  return (
    <>
      <p className="text-sm text-slate-500">
        DSA Practical Lab / Array Sum
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{student}’s submission</h1>
      <Card>
        <div className="flex justify-between">
          <p className="font-medium">Passed all provided tests</p>
          <span className="text-sm text-slate-500">{language === "cpp" ? "C++" : "Java"} · {submittedAt ? new Date(submittedAt).toLocaleString() : "6 Aug, 3:00 PM"}</span>
        </div>
        <pre className="mt-5 overflow-auto rounded bg-slate-950 p-4 text-sm text-slate-100">
          {source}
        </pre>
        <p className="mt-4 text-sm text-slate-600">
          {result ? `${result.passedTests}/${result.totalTests}` : "2/2"} visible tests passed. Example 1: Passed · Example 2: Passed.
        </p>
      </Card>
    </>
  );
}
