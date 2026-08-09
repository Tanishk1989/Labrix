import type { Classroom } from "@/domain/tasks/models";

export const demoClassroom: Classroom = {
  id: "dsa-2026",
  name: "DSA Practical Lab",
  subject: "Data Structures & Algorithms",
  section: "BTech CSE · Section A",
  joinCode: "ARRAY-42",
  students: [
    {
      id: "student-1",
      name: "Aarav Mehta",
      email: "aarav@example.edu",
      draftExists: true,
    },
    {
      id: "student-2",
      name: "Diya Sharma",
      email: "diya@example.edu",
      draftExists: false,
      submission: {
        id: "sub-1",
        taskId: "two-sum",
        studentName: "Diya Sharma",
        language: "java",
        sourceCode: "// Submitted Java solution",
        submittedAt: "2026-08-06T09:30:00.000Z",
        passedTests: 2,
        totalTests: 2,
      },
    },
    {
      id: "student-3",
      name: "Kabir Singh",
      email: "kabir@example.edu",
      draftExists: false,
    },
  ],
  tasks: [
    {
      id: "two-sum",
      classroomId: "dsa-2026",
      title: "Array Sum",
      description:
        "Given an array of integers and a target, print indices of two values whose sum equals the target.",
      constraints: ["2 ≤ n ≤ 10⁵", "Use an efficient approach"],
      allowedLanguages: ["cpp", "java"],
      deadline: "2026-08-12T17:00:00.000Z",
      tests: [
        {
          id: "test-1",
          label: "Example 1",
          input: "4\n2 7 11 15\n9",
          expectedOutput: "0 1",
        },
        {
          id: "test-2",
          label: "Example 2",
          input: "3\n3 2 4\n6",
          expectedOutput: "1 2",
        },
      ],
    },
  ],
};
