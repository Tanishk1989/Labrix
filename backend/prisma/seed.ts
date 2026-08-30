import {
  AllowedLanguage,
  CodeEventType,
  CodingSessionStatus,
  ExecutionMode,
  MembershipRole,
  PlatformRole,
  Prisma,
  PrismaClient,
  RunResultState,
  SubmissionReviewStatus,
  TaskStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const classroomId = "dsa-2026";
const teacherId = "demo-teacher";
const demoTaskIds = ["two-sum", "balanced-brackets", "campus-route-planner"];

const cppPairSum = `#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
  int n, target;
  cin >> n;
  vector<int> values(n);
  for (int &value : values) cin >> value;
  cin >> target;

  unordered_map<int, int> seen;
  for (int i = 0; i < n; i++) {
    int needed = target - values[i];
    if (seen.count(needed)) {
      cout << seen[needed] << " " << i;
      return 0;
    }
    seen[values[i]] = i;
  }
}`;

const cppPairSumFirstAttempt = `#include <iostream>
#include <vector>
using namespace std;

int main() {
  int n, target;
  cin >> n;
  vector<int> values(n);
  for (int &value : values) cin >> value;
  cin >> target;

  for (int i = 0; i < n - 1; i++) {
    if (values[i] + values[i + 1] == target) {
      cout << i << " " << i + 1;
      return 0;
    }
  }
}`;

const javaBracketSolution = `import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);
    String value = scanner.nextLine();
    Deque<Character> stack = new ArrayDeque<>();

    for (char symbol : value.toCharArray()) {
      if (symbol == '(' || symbol == '[' || symbol == '{') {
        stack.push(symbol);
      } else if (stack.isEmpty()
          || (symbol == ')' && stack.pop() != '(')
          || (symbol == ']' && stack.pop() != '[')
          || (symbol == '}' && stack.pop() != '{')) {
        System.out.print("false");
        return;
      }
    }
    System.out.print(stack.isEmpty());
  }
}`;

type SeedSubmission = {
  id: string;
  taskId: string;
  studentId: string;
  attemptNumber: number;
  language: AllowedLanguage;
  sourceCode: string;
  startedAt: Date;
  submittedAt: Date;
  executionMode: ExecutionMode;
  state: RunResultState;
  passedTests: number;
  visiblePassedTests: number;
  hiddenPassedTests: number;
  errorText?: string;
  testResults: Prisma.InputJsonValue;
  review?: {
    feedback: string;
    marksAwarded: number;
    status: SubmissionReviewStatus;
    publishedAt?: Date;
    criterionScores?: number[];
  };
};

async function clearDemoHistory() {
  const sessions = await prisma.codingSession.findMany({
    where: { taskId: { in: demoTaskIds } },
    select: { id: true },
  });
  const sessionIds = sessions.map(({ id }) => id);
  const runs = await prisma.runAttempt.findMany({
    where: { codingSessionId: { in: sessionIds } },
    select: { id: true },
  });
  const submissions = await prisma.submissionAttempt.findMany({
    where: { taskId: { in: demoTaskIds } },
    select: { id: true },
  });
  const reviews = await prisma.submissionReview.findMany({
    where: { submissionAttemptId: { in: submissions.map(({ id }) => id) } },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.submissionReviewRevision.deleteMany({ where: { reviewId: { in: reviews.map(({ id }) => id) } } }),
    prisma.submissionReviewCriterionScore.deleteMany({ where: { reviewId: { in: reviews.map(({ id }) => id) } } }),
    prisma.submissionReview.deleteMany({
      where: { submissionAttemptId: { in: submissions.map(({ id }) => id) } },
    }),
    prisma.codeEvent.deleteMany({ where: { codingSessionId: { in: sessionIds } } }),
    prisma.submissionAttempt.deleteMany({ where: { taskId: { in: demoTaskIds } } }),
    prisma.resultSnapshot.deleteMany({
      where: { runAttemptId: { in: runs.map(({ id }) => id) } },
    }),
    prisma.runAttempt.deleteMany({ where: { codingSessionId: { in: sessionIds } } }),
    prisma.draft.deleteMany({ where: { codingSessionId: { in: sessionIds } } }),
    prisma.codingSession.deleteMany({ where: { id: { in: sessionIds } } }),
    prisma.testCase.deleteMany({ where: { taskId: { in: demoTaskIds } } }),
  ]);
}

async function createSubmittedAttempt(input: SeedSubmission) {
  const sessionId = `demo-session-${input.id}`;
  const runId = `demo-run-${input.id}`;
  const resultId = `demo-result-${input.id}`;
  const totalTests = 3;

  await prisma.codingSession.create({
    data: {
      id: sessionId,
      taskId: input.taskId,
      studentId: input.studentId,
      attemptNumber: input.attemptNumber,
      status: CodingSessionStatus.SUBMITTED,
      language: input.language,
      startedAt: input.startedAt,
      updatedAt: input.submittedAt,
      submittedAt: input.submittedAt,
    },
  });
  await prisma.draft.create({
    data: {
      id: `demo-draft-${input.id}`,
      codingSessionId: sessionId,
      sourceCode: input.sourceCode,
      revision: input.attemptNumber + 1,
      createdAt: input.startedAt,
      updatedAt: new Date(input.submittedAt.getTime() - 4 * 60_000),
    },
  });
  await prisma.runAttempt.create({
    data: {
      id: runId,
      codingSessionId: sessionId,
      sequence: 1,
      language: input.language,
      sourceCodeSnapshot: input.sourceCode,
      requestedAt: new Date(input.submittedAt.getTime() - 2 * 60_000),
      completedAt: new Date(input.submittedAt.getTime() - 90_000),
    },
  });
  await prisma.resultSnapshot.create({
    data: {
      id: resultId,
      runAttemptId: runId,
      state: input.state,
      executionMode: input.executionMode,
      passedTests: input.passedTests,
      totalTests,
      visiblePassedTests: input.visiblePassedTests,
      visibleTotalTests: 2,
      hiddenPassedTests: input.hiddenPassedTests,
      hiddenTotalTests: 1,
      suggestedScore: Math.round((input.passedTests / totalTests) * 100) / 10,
      errorText: input.errorText,
      testResults: input.testResults,
      createdAt: new Date(input.submittedAt.getTime() - 90_000),
    },
  });
  await prisma.submissionAttempt.create({
    data: {
      id: input.id,
      taskId: input.taskId,
      studentId: input.studentId,
      codingSessionId: sessionId,
      resultSnapshotId: resultId,
      attemptNumber: input.attemptNumber,
      idempotencyKey: `seed-${input.id}`,
      language: input.language,
      sourceCodeSnapshot: input.sourceCode,
      submittedAt: input.submittedAt,
    },
  });
  await prisma.codeEvent.createMany({
    data: [
      { id: `demo-event-${input.id}-1`, codingSessionId: sessionId, sequence: 1, type: CodeEventType.SESSION_STARTED, occurredAt: input.startedAt },
      { id: `demo-event-${input.id}-2`, codingSessionId: sessionId, sequence: 2, type: CodeEventType.DRAFT_SAVED, occurredAt: new Date(input.submittedAt.getTime() - 4 * 60_000) },
      { id: `demo-event-${input.id}-3`, codingSessionId: sessionId, sequence: 3, type: CodeEventType.RUN_REQUESTED, runAttemptId: runId, occurredAt: new Date(input.submittedAt.getTime() - 2 * 60_000) },
      { id: `demo-event-${input.id}-4`, codingSessionId: sessionId, sequence: 4, type: CodeEventType.RUN_COMPLETED, runAttemptId: runId, occurredAt: new Date(input.submittedAt.getTime() - 90_000) },
      { id: `demo-event-${input.id}-5`, codingSessionId: sessionId, sequence: 5, type: CodeEventType.SUBMISSION_CREATED, runAttemptId: runId, submissionAttemptId: input.id, occurredAt: input.submittedAt },
    ],
  });

  if (input.review) {
    const task = await prisma.task.findUniqueOrThrow({ where: { id: input.taskId }, include: { rubricCriteria: { orderBy: { position: "asc" } } } });
    const review = await prisma.submissionReview.create({
      data: {
        id: `demo-review-${input.id}`,
        submissionAttemptId: input.id,
        reviewerTeacherId: teacherId,
        feedback: input.review.feedback,
        marksAwarded: input.review.marksAwarded,
        marksOutOf: task.maximumMarks,
        status: input.review.status,
        publishedAt: input.review.publishedAt,
        createdAt: new Date(input.submittedAt.getTime() + 24 * 60 * 60_000),
        updatedAt: input.review.publishedAt ?? new Date(input.submittedAt.getTime() + 24 * 60 * 60_000),
      },
    });
    if (task.rubricCriteria.length > 0) {
      await prisma.submissionReviewCriterionScore.createMany({ data: task.rubricCriteria.map((criterion, index) => ({ reviewId: review.id, criterionId: criterion.id, marksAwarded: input.review?.criterionScores?.[index] ?? 0 })) });
    }
    await prisma.submissionReviewRevision.create({
      data: {
        id: `demo-review-revision-${input.id}-1`,
        reviewId: review.id,
        reviewerTeacherId: teacherId,
        version: 1,
        feedback: input.review.feedback,
        marksAwarded: input.review.marksAwarded,
        marksOutOf: task.maximumMarks,
        status: input.review.status,
        publishedAt: input.review.publishedAt,
        rubricScores: task.rubricCriteria.map((criterion, index) => ({ title: criterion.title, marksAwarded: input.review?.criterionScores?.[index] ?? 0, maximumMarks: criterion.maximumMarks })),
        createdAt: input.review.publishedAt ?? new Date(input.submittedAt.getTime() + 24 * 60 * 60_000),
      },
    });
  }
}

async function main() {
  const teacher = await prisma.user.upsert({
    where: { id: teacherId },
    update: { name: "Dr. Meera Sharma", email: "meera.sharma@northbridge.example", platformRole: PlatformRole.TEACHER },
    create: { id: teacherId, name: "Dr. Meera Sharma", email: "meera.sharma@northbridge.example", platformRole: PlatformRole.TEACHER, createdAt: new Date("2026-07-20T04:30:00Z") },
  });
  await prisma.classroom.upsert({
    where: { id: classroomId },
    update: { name: "DSA Practical Lab", subject: "Data Structures & Algorithms", section: "BTech CSE · Semester III · Section A", ownerTeacherId: teacher.id, joinCode: "ARRAY-42", createdAt: new Date("2026-07-22T04:30:00Z") },
    create: { id: classroomId, name: "DSA Practical Lab", subject: "Data Structures & Algorithms", section: "BTech CSE · Semester III · Section A", ownerTeacherId: teacher.id, joinCode: "ARRAY-42", createdAt: new Date("2026-07-22T04:30:00Z") },
  });
  await prisma.classMembership.upsert({
    where: { classroomId_userId: { classroomId, userId: teacher.id } },
    update: { role: MembershipRole.TEACHER, active: true, joinedAt: new Date("2026-07-22T04:30:00Z") },
    create: { classroomId, userId: teacher.id, role: MembershipRole.TEACHER, joinedAt: new Date("2026-07-22T04:30:00Z") },
  });

  const students = [
    { id: "demo-student-1", name: "Aarav Mehta", email: "aarav.mehta.26@northbridge.example" },
    { id: "demo-student-2", name: "Diya Sharma", email: "diya.sharma.26@northbridge.example" },
    { id: "demo-student-3", name: "Kabir Singh", email: "kabir.singh.26@northbridge.example" },
  ];
  for (const [index, studentData] of students.entries()) {
    const student = await prisma.user.upsert({
      where: { id: studentData.id },
      update: { name: studentData.name, email: studentData.email, platformRole: PlatformRole.STUDENT },
      create: { ...studentData, platformRole: PlatformRole.STUDENT, createdAt: new Date("2026-07-24T04:30:00Z") },
    });
    await prisma.classMembership.upsert({
      where: { classroomId_userId: { classroomId, userId: student.id } },
      update: { role: MembershipRole.STUDENT, active: true, joinedAt: new Date(Date.UTC(2026, 6, 25 + index, 4, 30)) },
      create: { classroomId, userId: student.id, role: MembershipRole.STUDENT, joinedAt: new Date(Date.UTC(2026, 6, 25 + index, 4, 30)) },
    });
  }

  await clearDemoHistory();

  await prisma.task.upsert({
    where: { id: "two-sum" },
    update: { classroomId, authorTeacherId: teacher.id, title: "Array Sum", instructions: "Given an array of integers and a target, print the zero-based indices of two distinct values whose sum equals the target. Exactly one valid pair exists.", constraints: "2 ≤ n ≤ 100,000\n-10⁹ ≤ values[i], target ≤ 10⁹\nTarget complexity: O(n) time.", allowedLanguages: [AllowedLanguage.CPP, AllowedLanguage.JAVA], cppStarterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n  // fail_test — replace this comment with your solution\n  return 0;\n}\n", javaStarterCode: "// Read n, the array, and target. Print the two zero-based indices.\n", status: TaskStatus.PUBLISHED, publishedAt: new Date("2026-08-03T04:30:00Z"), deadline: new Date("2027-08-18T11:30:00Z"), createdAt: new Date("2026-08-02T04:30:00Z") },
    create: { id: "two-sum", classroomId, authorTeacherId: teacher.id, title: "Array Sum", instructions: "Given an array of integers and a target, print the zero-based indices of two distinct values whose sum equals the target. Exactly one valid pair exists.", constraints: "2 ≤ n ≤ 100,000\n-10⁹ ≤ values[i], target ≤ 10⁹\nTarget complexity: O(n) time.", allowedLanguages: [AllowedLanguage.CPP, AllowedLanguage.JAVA], cppStarterCode: "#include <iostream>\nusing namespace std;\n\nint main() {\n  // fail_test — replace this comment with your solution\n  return 0;\n}\n", javaStarterCode: "// Read n, the array, and target. Print the two zero-based indices.\n", status: TaskStatus.PUBLISHED, publishedAt: new Date("2026-08-03T04:30:00Z"), deadline: new Date("2027-08-18T11:30:00Z"), createdAt: new Date("2026-08-02T04:30:00Z") },
  });
  await prisma.task.upsert({
    where: { id: "balanced-brackets" },
    update: { classroomId, authorTeacherId: teacher.id, title: "Balanced Brackets", instructions: "Given one line containing only bracket characters, print true when every opening bracket is closed in the correct order; otherwise print false.", constraints: "1 ≤ length ≤ 100,000\nInput contains only (), [] and {}.\nUse an explicit stack.", allowedLanguages: [AllowedLanguage.CPP, AllowedLanguage.JAVA], cppStarterCode: "// Use a stack to validate the bracket sequence.\n", javaStarterCode: "// Use a Deque as a stack to validate the bracket sequence.\n", status: TaskStatus.PUBLISHED, publishedAt: new Date("2026-08-07T04:30:00Z"), deadline: new Date("2027-08-15T11:30:00Z"), maximumMarks: 20, createdAt: new Date("2026-08-06T04:30:00Z") },
    create: { id: "balanced-brackets", classroomId, authorTeacherId: teacher.id, title: "Balanced Brackets", instructions: "Given one line containing only bracket characters, print true when every opening bracket is closed in the correct order; otherwise print false.", constraints: "1 ≤ length ≤ 100,000\nInput contains only (), [] and {}.\nUse an explicit stack.", allowedLanguages: [AllowedLanguage.CPP, AllowedLanguage.JAVA], cppStarterCode: "// Use a stack to validate the bracket sequence.\n", javaStarterCode: "// Use a Deque as a stack to validate the bracket sequence.\n", status: TaskStatus.PUBLISHED, publishedAt: new Date("2026-08-07T04:30:00Z"), deadline: new Date("2027-08-15T11:30:00Z"), maximumMarks: 20, createdAt: new Date("2026-08-06T04:30:00Z") },
  });
  await prisma.task.upsert({
    where: { id: "campus-route-planner" },
    update: { classroomId, authorTeacherId: teacher.id, title: "Campus Route Planner", instructions: "Model campus locations as a graph and print the shortest unweighted route between two named locations.", constraints: "Draft brief — constraints and tests are still being prepared.", allowedLanguages: [AllowedLanguage.CPP, AllowedLanguage.JAVA], cppStarterCode: null, javaStarterCode: null, status: TaskStatus.DRAFT, publishedAt: null, deadline: new Date("2026-08-25T11:30:00Z"), createdAt: new Date("2026-08-10T04:30:00Z") },
    create: { id: "campus-route-planner", classroomId, authorTeacherId: teacher.id, title: "Campus Route Planner", instructions: "Model campus locations as a graph and print the shortest unweighted route between two named locations.", constraints: "Draft brief — constraints and tests are still being prepared.", allowedLanguages: [AllowedLanguage.CPP, AllowedLanguage.JAVA], status: TaskStatus.DRAFT, deadline: new Date("2026-08-25T11:30:00Z"), createdAt: new Date("2026-08-10T04:30:00Z") },
  });

  await prisma.rubricCriterion.deleteMany({ where: { taskId: { in: demoTaskIds } } });
  await prisma.rubricCriterion.createMany({ data: [
    { id: "brackets-rubric-correctness", taskId: "balanced-brackets", position: 1, title: "Correctness", maximumMarks: 10 },
    { id: "brackets-rubric-complexity", taskId: "balanced-brackets", position: 2, title: "Complexity", maximumMarks: 6 },
    { id: "brackets-rubric-quality", taskId: "balanced-brackets", position: 3, title: "Code quality", maximumMarks: 4 },
  ] });

  await prisma.testCase.createMany({ data: [
    { id: "two-sum-visible-1", taskId: "two-sum", position: 1, input: "4\n2 7 11 15\n9", expectedOutput: "0 1", visible: true },
    { id: "two-sum-visible-2", taskId: "two-sum", position: 2, input: "3\n3 2 4\n6", expectedOutput: "1 2", visible: true },
    { id: "two-sum-hidden-1", taskId: "two-sum", position: 3, input: "5\n-3 4 3 90 6\n0", expectedOutput: "0 2", visible: false },
    { id: "brackets-visible-1", taskId: "balanced-brackets", position: 1, input: "()[]{}", expectedOutput: "true", visible: true },
    { id: "brackets-visible-2", taskId: "balanced-brackets", position: 2, input: "([)]", expectedOutput: "false", visible: true },
    { id: "brackets-hidden-1", taskId: "balanced-brackets", position: 3, input: "{[()()]}", expectedOutput: "true", visible: false },
  ] });

  const passedPairSumResults = [
    { testId: "two-sum-visible-1", passed: true, actualOutput: "0 1", visibility: "VISIBLE" },
    { testId: "two-sum-visible-2", passed: true, actualOutput: "1 2", visibility: "VISIBLE" },
    { testId: "two-sum-hidden-1", passed: true, actualOutput: "0 2", visibility: "HIDDEN" },
  ] as Prisma.InputJsonValue;
  await createSubmittedAttempt({ id: "demo-submission-aarav-array-1", taskId: "two-sum", studentId: "demo-student-1", attemptNumber: 1, language: AllowedLanguage.CPP, sourceCode: cppPairSumFirstAttempt, startedAt: new Date("2026-08-05T09:10:00Z"), submittedAt: new Date("2026-08-05T09:34:00Z"), executionMode: ExecutionMode.CPP_DOCKER_LOCAL, state: RunResultState.COMPLETED, passedTests: 1, visiblePassedTests: 1, hiddenPassedTests: 0, testResults: [
    { testId: "two-sum-visible-1", passed: true, actualOutput: "0 1", visibility: "VISIBLE" },
    { testId: "two-sum-visible-2", passed: false, actualOutput: "", visibility: "VISIBLE" },
    { testId: "two-sum-hidden-1", passed: false, actualOutput: "", visibility: "HIDDEN" },
  ], review: { feedback: "Your input handling is clear, but checking only adjacent values misses valid pairs. Use a hash map or justify another approach that considers every candidate pair.", marksAwarded: 4, status: SubmissionReviewStatus.PUBLISHED, publishedAt: new Date("2026-08-06T06:15:00Z") } });
  await createSubmittedAttempt({ id: "demo-submission-aarav-array-2", taskId: "two-sum", studentId: "demo-student-1", attemptNumber: 2, language: AllowedLanguage.CPP, sourceCode: cppPairSum, startedAt: new Date("2026-08-07T07:40:00Z"), submittedAt: new Date("2026-08-07T08:12:00Z"), executionMode: ExecutionMode.CPP_DOCKER_LOCAL, state: RunResultState.COMPLETED, passedTests: 3, visiblePassedTests: 2, hiddenPassedTests: 1, testResults: passedPairSumResults, review: { feedback: "Strong revision. The hash-map lookup meets the intended O(n) complexity, and the variable names make the reasoning easy to follow.", marksAwarded: 10, status: SubmissionReviewStatus.PUBLISHED, publishedAt: new Date("2026-08-08T05:30:00Z") } });
  await createSubmittedAttempt({ id: "demo-submission-diya-array-1", taskId: "two-sum", studentId: "demo-student-2", attemptNumber: 1, language: AllowedLanguage.JAVA, sourceCode: "public class Main {\n  public static void main(String[] args) {\n    System.out.println(\"working on it\")\n  }\n}", startedAt: new Date("2026-08-10T10:05:00Z"), submittedAt: new Date("2026-08-10T10:26:00Z"), executionMode: ExecutionMode.JAVA_DOCKER_LOCAL, state: RunResultState.COMPILATION_ERROR, passedTests: 0, visiblePassedTests: 0, hiddenPassedTests: 0, errorText: "Main.java:3: error: ';' expected", testResults: [] });
  await createSubmittedAttempt({ id: "demo-submission-diya-brackets-1", taskId: "balanced-brackets", studentId: "demo-student-2", attemptNumber: 1, language: AllowedLanguage.JAVA, sourceCode: javaBracketSolution, startedAt: new Date("2026-08-11T05:20:00Z"), submittedAt: new Date("2026-08-11T06:02:00Z"), executionMode: ExecutionMode.JAVA_DOCKER_LOCAL, state: RunResultState.COMPLETED, passedTests: 3, visiblePassedTests: 2, hiddenPassedTests: 1, testResults: [
    { testId: "brackets-visible-1", passed: true, actualOutput: "true", visibility: "VISIBLE" },
    { testId: "brackets-visible-2", passed: true, actualOutput: "false", visibility: "VISIBLE" },
    { testId: "brackets-hidden-1", passed: true, actualOutput: "true", visibility: "HIDDEN" },
  ], review: { feedback: "Correct stack discipline and good use of Deque. Before publishing, I want to add a note about separating bracket matching into a small helper method.", marksAwarded: 18, status: SubmissionReviewStatus.DRAFT, criterionScores: [10, 5, 3] } });

  const pulseNow = new Date();
  const minutesAgo = (minutes: number) => new Date(pulseNow.getTime() - minutes * 60_000);
  await prisma.codingSession.create({
    data: { id: "demo-session-aarav-brackets-active", taskId: "balanced-brackets", studentId: "demo-student-1", attemptNumber: 1, status: CodingSessionStatus.ACTIVE, language: AllowedLanguage.CPP, startedAt: minutesAgo(18), updatedAt: minutesAgo(2), draft: { create: { id: "demo-draft-aarav-brackets-active", sourceCode: "#include <iostream>\n#include <stack>\nusing namespace std;\n\nint main() {\n  // Continue bracket matching here.\n}\n", revision: 2, createdAt: minutesAgo(18), updatedAt: minutesAgo(2) } } },
  });
  await prisma.codeEvent.createMany({ data: [
    { id: "demo-event-aarav-brackets-1", codingSessionId: "demo-session-aarav-brackets-active", sequence: 1, type: CodeEventType.SESSION_STARTED, occurredAt: minutesAgo(18) },
    { id: "demo-event-aarav-brackets-2", codingSessionId: "demo-session-aarav-brackets-active", sequence: 2, type: CodeEventType.DRAFT_SAVED, occurredAt: minutesAgo(2) },
  ] });

  await prisma.codingSession.create({
    data: {
      id: "demo-session-diya-brackets-active",
      taskId: "balanced-brackets",
      studentId: "demo-student-2",
      attemptNumber: 2,
      status: CodingSessionStatus.ACTIVE,
      language: AllowedLanguage.JAVA,
      startedAt: minutesAgo(24),
      updatedAt: minutesAgo(6),
      draft: { create: { id: "demo-draft-diya-brackets-active", sourceCode: "public class Main {\n  public static void main(String[] args) {\n    // Revising bracket matching after failed tests.\n  }\n}\n", revision: 3, createdAt: minutesAgo(24), updatedAt: minutesAgo(6) } },
    },
  });
  for (const [index, requestedMinutesAgo] of [11, 7].entries()) {
    const runId = `demo-run-diya-brackets-pulse-${index + 1}`;
    await prisma.runAttempt.create({
      data: {
        id: runId,
        codingSessionId: "demo-session-diya-brackets-active",
        sequence: index + 1,
        language: AllowedLanguage.JAVA,
        sourceCodeSnapshot: "public class Main { public static void main(String[] args) {} }",
        requestedAt: minutesAgo(requestedMinutesAgo),
        completedAt: minutesAgo(requestedMinutesAgo - 1),
        resultSnapshot: {
          create: {
            id: `demo-result-diya-brackets-pulse-${index + 1}`,
            state: RunResultState.COMPLETED,
            passedTests: index,
            totalTests: 2,
            visiblePassedTests: index,
            visibleTotalTests: 2,
            testResults: [],
            executionMode: ExecutionMode.SIMULATED,
          },
        },
      },
    });
  }
  await prisma.codeEvent.createMany({ data: [
    { id: "demo-event-diya-brackets-pulse-1", codingSessionId: "demo-session-diya-brackets-active", sequence: 1, type: CodeEventType.SESSION_STARTED, occurredAt: minutesAgo(24) },
    { id: "demo-event-diya-brackets-pulse-2", codingSessionId: "demo-session-diya-brackets-active", sequence: 2, type: CodeEventType.RUN_REQUESTED, runAttemptId: "demo-run-diya-brackets-pulse-1", occurredAt: minutesAgo(11) },
    { id: "demo-event-diya-brackets-pulse-3", codingSessionId: "demo-session-diya-brackets-active", sequence: 3, type: CodeEventType.RUN_COMPLETED, runAttemptId: "demo-run-diya-brackets-pulse-1", occurredAt: minutesAgo(10) },
    { id: "demo-event-diya-brackets-pulse-4", codingSessionId: "demo-session-diya-brackets-active", sequence: 4, type: CodeEventType.RUN_REQUESTED, runAttemptId: "demo-run-diya-brackets-pulse-2", occurredAt: minutesAgo(7) },
    { id: "demo-event-diya-brackets-pulse-5", codingSessionId: "demo-session-diya-brackets-active", sequence: 5, type: CodeEventType.RUN_COMPLETED, runAttemptId: "demo-run-diya-brackets-pulse-2", occurredAt: minutesAgo(6) },
  ] });
}

main()
  .then(() => console.log("Seeded the deterministic professor demo scenario."))
  .finally(() => prisma.$disconnect());
