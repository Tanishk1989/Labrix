export type DemoRole = "teacher" | "student";
export type Language = "cpp" | "java";
export type AllowedLanguage = "CPP" | "JAVA";
export type TaskStatus = "DRAFT" | "PUBLISHED";
export type TaskState =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "submitted_late"
  | "expired";
export type ExecutionState =
  | "queued"
  | "running"
  | "completed"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "internal_error";

export interface TestCase {
  id: string;
  label: string;
  input: string;
  expectedOutput: string;
}
export interface Task {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  constraints: string[];
  allowedLanguages: Language[];
  deadline: string | null;
  tests: TestCase[];
}
export interface Submission {
  id: string;
  taskId: string;
  studentName: string;
  language: Language;
  sourceCode: string;
  submittedAt: string;
  passedTests: number;
  totalTests: number;
}
export interface DemoStudent {
  id: string;
  name: string;
  email: string;
  draftExists: boolean;
  submission?: Submission;
}
export interface Classroom {
  id: string;
  name: string;
  subject: string;
  section: string;
  joinCode: string;
  students: DemoStudent[];
  tasks: Task[];
}
