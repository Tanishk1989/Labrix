import { describe, expect, it } from "vitest";
import { generateVivaDefense } from "../../backend/server/evidence/viva-generator";

describe("AI Code-Grounded Viva Generator (05-AI-EVIDENCE-SYSTEM.md)", () => {
  it("generates 4 structured viva questions for C++ implementation", () => {
    const cppCode = `
#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

int findMajorityElement(vector<int>& nums) {
    unordered_map<int, int> counts;
    for (int num : nums) {
        counts[num]++;
        if (counts[num] > nums.size() / 2) {
            return num;
        }
    }
    return -1;
}

int main() {
    vector<int> sample = {2, 2, 1, 1, 1, 2, 2};
    cout << findMajorityElement(sample) << endl;
    return 0;
}
    `.trim();

    const result = generateVivaDefense({
      sourceCode: cppCode,
      language: "CPP",
      taskTitle: "Majority Element Finder",
      testPassRatio: { passed: 5, total: 5 },
    });

    expect(result.questions).toHaveLength(4);
    expect(result.codeInsights.detectedDataStructures).toContain("std::vector");
    expect(result.codeInsights.detectedDataStructures).toContain("std::map / hash table");
    expect(result.codeInsights.detectedFunctions).toContain("findMajorityElement");

    // Question categories
    const categories = result.questions.map((q) => q.category);
    expect(categories).toContain("IMPLEMENTATION_CHOICE");
    expect(categories).toContain("COMPLEXITY_EDGE_CASES");
    expect(categories).toContain("MODIFICATION_CHALLENGE");
    expect(categories).toContain("PROCESS_GROUNDED_PROBE");

    // Check constructive feedback draft
    expect(result.feedbackDraft).toContain("Majority Element Finder");
    expect(result.feedbackDraft).toContain("5/5");
  });

  it("generates structured questions for Java implementation", () => {
    const javaCode = `
import java.util.*;

public class Solution {
    public static int searchTarget(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }
}
    `.trim();

    const result = generateVivaDefense({
      sourceCode: javaCode,
      language: "JAVA",
      taskTitle: "Binary Search",
      testPassRatio: { passed: 4, total: 4 },
    });

    expect(result.questions).toHaveLength(4);
    expect(result.codeInsights.detectedFunctions).toContain("searchTarget");
    expect(result.codeInsights.estimatedComplexity).toContain("O(log N)");
  });
});
