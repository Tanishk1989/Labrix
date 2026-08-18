import { describe, expect, it } from "vitest";
import {
  computeStructuralSimilarity,
  normalizeSourceToASTTokens,
  auditCohortPlagiarism,
} from "@/server/evidence/structural-ast-comparator";

describe("Structural AST Plagiarism & Invariant Engine", () => {
  it("normalizes variable renaming to identical AST token streams", () => {
    const codeA = `
      #include <iostream>
      using namespace std;
      int main() {
        int count = 0;
        for (int i = 0; i < 10; i++) {
          count += i;
        }
        cout << count << endl;
        return 0;
      }
    `;

    const codeB = `
      #include <iostream>
      using namespace std;
      int main() {
        int total = 0; // Renamed variable
        for (int idx = 0; idx < 10; idx++) {
          total += idx; // Different variable name
        }
        cout << total << endl;
        return 0;
      }
    `;

    const tokensA = normalizeSourceToASTTokens(codeA, "CPP");
    const tokensB = normalizeSourceToASTTokens(codeB, "CPP");

    // Both should yield the exact same normalized structural token count & sequence
    expect(tokensA.map((t) => t.token)).toEqual(tokensB.map((t) => t.token));

    const result = computeStructuralSimilarity(
      { id: "sub-1", studentName: "Aarav", sourceCode: codeA, language: "CPP" },
      { id: "sub-2", studentName: "Rohan", sourceCode: codeB, language: "CPP" },
    );

    expect(result.structuralSimilarityPercentage).toBeGreaterThanOrEqual(90);
    expect(result.verdict).toBe("STRUCTURAL_COLLUSION_FLAG");
    expect(result.variableRenamingDetected).toBe(true);
  });

  it("detects genuine structural divergence between different algorithms", () => {
    const codeStack = `
      #include <iostream>
      #include <stack>
      using namespace std;
      bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
          if (c == '(') st.push(')');
          else if (st.empty() || st.top() != c) return false;
          else st.pop();
        }
        return st.empty();
      }
    `;

    const codeCounter = `
      #include <iostream>
      using namespace std;
      bool isValid(string s) {
        int balance = 0;
        int len = s.length();
        int i = 0;
        while (i < len) {
          if (s[i] == '(') balance++;
          else balance--;
          if (balance < 0) return false;
          i++;
        }
        return balance == 0;
      }
    `;

    const result = computeStructuralSimilarity(
      { id: "sub-1", studentName: "Aarav", sourceCode: codeStack, language: "CPP" },
      { id: "sub-2", studentName: "Priya", sourceCode: codeCounter, language: "CPP" },
    );

    expect(result.structuralSimilarityPercentage).toBeLessThan(50);
    expect(result.verdict).toBe("AUTHENTIC");
  });

  it("audits a cohort and flags highest collusion pairs first", () => {
    const submissions = [
      {
        id: "sub-1",
        studentId: "s-1",
        studentName: "Aarav",
        sourceCode: `int add(int a, int b) { return a + b; }`,
        language: "CPP" as const,
      },
      {
        id: "sub-2",
        studentId: "s-2",
        studentName: "Rohan",
        sourceCode: `int sum(int x, int y) { return x + y; }`,
        language: "CPP" as const,
      },
      {
        id: "sub-3",
        studentId: "s-3",
        studentName: "Priya",
        sourceCode: `int multiply(int a, int b) { int res = 0; for(int i=0; i<b; i++) res += a; return res; }`,
        language: "CPP" as const,
      },
    ];

    const flaggedPairs = auditCohortPlagiarism(submissions);
    expect(flaggedPairs.length).toBeGreaterThan(0);
    expect(flaggedPairs[0].studentAName).toBe("Aarav");
    expect(flaggedPairs[0].studentBName).toBe("Rohan");
  });
});
