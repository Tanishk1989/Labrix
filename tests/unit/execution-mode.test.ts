import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ExecutionModeBadge } from "@/components/execution-mode-badge";
import {
  executionModeFromPersistedSnapshot,
  executionModeLabel,
} from "@/domain/execution/execution-mode";

describe("execution mode disclosure", () => {
  it("uses the exact public labels for active providers", () => {
    expect(executionModeLabel("simulated")).toBe("Simulated execution");
    expect(executionModeLabel("java-docker-local")).toBe(
      "Java Docker runner",
    );
    expect(executionModeLabel("cpp-docker-local")).toBe(
      "C++ Docker runner",
    );
  });

  it("does not infer a provider for a legacy persisted snapshot", () => {
    const mode = executionModeFromPersistedSnapshot(null);
    const markup = renderToStaticMarkup(
      createElement(ExecutionModeBadge, { mode }),
    );

    expect(mode).toBe("unavailable");
    expect(markup).toContain("Execution mode unavailable");
    expect(markup).not.toContain("Simulated execution");
    expect(markup).not.toContain("Java Docker runner");
    expect(markup).not.toContain("C++ Docker runner");
  });

  it.each([
    ["simulated", "Simulated execution"],
    ["java-docker-local", "Java Docker runner"],
    ["cpp-docker-local", "C++ Docker runner"],
  ] as const)("keeps the persisted %s label consistent", (mode, label) => {
    expect(executionModeLabel(executionModeFromPersistedSnapshot(mode))).toBe(
      label,
    );
  });
});
