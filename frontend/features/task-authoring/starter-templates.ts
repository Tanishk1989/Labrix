export interface PracticalTemplate {
  id: string;
  title: string;
  badge: string;
  instructions: string;
  constraints: string;
  testCases: Array<{
    clientId: string;
    input: string;
    expectedOutput: string;
    visible: boolean;
  }>;
  maximumMarks: number;
}

export const PRACTICAL_STARTER_TEMPLATES: PracticalTemplate[] = [
  {
    id: "balanced-brackets",
    title: "Balanced Parentheses & Brackets Validator",
    badge: "Stack DSA · Easy",
    instructions:
      "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.\n\nPrint 'true' if valid, else 'false'.",
    constraints: "1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'.",
    testCases: [
      { clientId: "tc-tmpl-1", input: "()", expectedOutput: "true", visible: true },
      { clientId: "tc-tmpl-2", input: "()[]{}", expectedOutput: "true", visible: true },
      { clientId: "tc-tmpl-3", input: "(]", expectedOutput: "false", visible: true },
      { clientId: "tc-tmpl-4", input: "([)]", expectedOutput: "false", visible: false },
      { clientId: "tc-tmpl-5", input: "{[]}", expectedOutput: "true", visible: false },
    ],
    maximumMarks: 10,
  },
  {
    id: "two-sum",
    title: "Two Sum Target Lookup",
    badge: "HashMap · Easy",
    instructions:
      "Given an array of integers `nums` and an integer `target`, return the 0-based indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nOutput the two indices separated by a single space (e.g. '0 1').",
    constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.",
    testCases: [
      { clientId: "tc-tmpl-ts-1", input: "4\n2 7 11 15\n9", expectedOutput: "0 1", visible: true },
      { clientId: "tc-tmpl-ts-2", input: "3\n3 2 4\n6", expectedOutput: "1 2", visible: true },
      { clientId: "tc-tmpl-ts-3", input: "2\n3 3\n6", expectedOutput: "0 1", visible: false },
    ],
    maximumMarks: 10,
  },
  {
    id: "binary-search",
    title: "Binary Search on Sorted Array",
    badge: "Divide & Conquer · O(log N)",
    instructions:
      "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    constraints: "1 <= nums.length <= 10^4\nAll integers in nums are unique.\nnums is sorted in ascending order.",
    testCases: [
      { clientId: "tc-tmpl-bs-1", input: "6\n-1 0 3 5 9 12\n9", expectedOutput: "4", visible: true },
      { clientId: "tc-tmpl-bs-2", input: "6\n-1 0 3 5 9 12\n2", expectedOutput: "-1", visible: true },
      { clientId: "tc-tmpl-bs-3", input: "1\n5\n5", expectedOutput: "0", visible: false },
    ],
    maximumMarks: 10,
  },
  {
    id: "merge-sorted",
    title: "Merge Two Sorted Arrays",
    badge: "Two Pointers · Medium",
    instructions:
      "You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order. Merge `nums1` and `nums2` into a single array sorted in non-decreasing order.\n\nOutput the merged elements separated by space.",
    constraints: "1 <= n, m <= 10^3\n-10^4 <= nums1[i], nums2[j] <= 10^4",
    testCases: [
      { clientId: "tc-tmpl-ms-1", input: "3 3\n1 2 3\n2 5 6", expectedOutput: "1 2 2 3 5 6", visible: true },
      { clientId: "tc-tmpl-ms-2", input: "1 1\n1\n2", expectedOutput: "1 2", visible: true },
      { clientId: "tc-tmpl-ms-3", input: "2 2\n3 4\n1 2", expectedOutput: "1 2 3 4", visible: false },
    ],
    maximumMarks: 10,
  },
];
