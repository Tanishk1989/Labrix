import { describe, expect, it } from "vitest";
import { nextWorkspacePanel } from "@/features/workspace/workspace-panels";

describe("mobile workspace panel navigation", () => {
  it("moves between adjacent panels and wraps at either edge", () => {
    expect(nextWorkspacePanel("problem", "ArrowRight")).toBe("code");
    expect(nextWorkspacePanel("results", "ArrowRight")).toBe("hints");
    expect(nextWorkspacePanel("hints", "ArrowRight")).toBe("problem");
    expect(nextWorkspacePanel("problem", "ArrowLeft")).toBe("hints");
  });

  it("moves directly to the first or last panel", () => {
    expect(nextWorkspacePanel("code", "Home")).toBe("problem");
    expect(nextWorkspacePanel("code", "End")).toBe("hints");
  });
});
