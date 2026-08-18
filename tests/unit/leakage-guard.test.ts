import { describe, expect, it } from "vitest";
import { verifyNoSolutionLeakage } from "@/server/hints/leakage-guard";

describe("Anti-Solution Leakage Guard", () => {
  it("rejects compilable boilerplate across all levels", () => {
    const badCpp = `Here is your fix: #include <iostream> int main() { return 0; }`;
    const badJava = `Use: public static void main(String[] args) { System.out.println(); }`;
    const badClass = `class Solution { public int[] twoSum() {} };`;

    expect(verifyNoSolutionLeakage(badCpp, 1).safe).toBe(false);
    expect(verifyNoSolutionLeakage(badJava, 2).safe).toBe(false);
    expect(verifyNoSolutionLeakage(badClass, 3).safe).toBe(false);
  });

  it("Level 1 strictly rejects code fences and concrete statement syntax", () => {
    const codeFence = "Think about this: ```cpp\nstack<char> s;\n```";
    const statementSyntax = "You should write: for (int i = 0; i < n; i++) { count++; }";

    expect(verifyNoSolutionLeakage(codeFence, 1).safe).toBe(false);
    expect(verifyNoSolutionLeakage(statementSyntax, 1).safe).toBe(false);

    const safeLevel1 = "Think about whether you need to remember elements you have already seen. What data structure gives you near-constant-time lookup?";
    expect(verifyNoSolutionLeakage(safeLevel1, 1).safe).toBe(true);
  });

  it("Level 2 strictly rejects complete functions and multi-line code blocks", () => {
    const fullFunction = "bool isValid(string s) { stack<char> st; return st.empty(); }";
    expect(verifyNoSolutionLeakage(fullFunction, 2).safe).toBe(false);

    const safeLevel2 = "Your loop stops before the last element is processed. Check the relationship between i, the array length, and your termination condition.";
    expect(verifyNoSolutionLeakage(safeLevel2, 2).safe).toBe(true);
  });

  it("Level 3 allows ordered reasoning scaffolds but rejects full compilable solutions", () => {
    const compilableSolution = "int solve(int n) { int count = 0; return count; }";
    expect(verifyNoSolutionLeakage(compilableSolution, 3).safe).toBe(false);

    const safeLevel3 = "1. Initialize an empty stack of characters.\n2. Iterate through each character in the string.\n3. If it is an opening bracket, push it onto the stack.\n4. If closing bracket, pop and verify match.\n5. Return true if stack is empty.";
    expect(verifyNoSolutionLeakage(safeLevel3, 3).safe).toBe(true);
  });
});
