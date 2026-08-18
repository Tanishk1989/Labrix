import { describe, expect, it } from "vitest";
import {
  getLocalDraftStorageKey,
  reconcileDraftVersions,
} from "@/features/workspace/offline-draft-mirror";

describe("Offline Draft Mirror", () => {
  it("generates namespaced storage key for coding sessions", () => {
    expect(getLocalDraftStorageKey("session-abc-123")).toBe("trace:draft-mirror:session-abc-123");
  });

  it("identifies un-synced local drafts that differ from server", () => {
    const serverCode = "int main() { return 0; }";
    const localMirror = {
      sessionId: "session-1",
      sourceCode: "int main() { int x = 42; return x; }",
      language: "CPP" as const,
      timestamp: Date.now(),
      syncedWithServer: false,
    };

    const reconciliation = reconcileDraftVersions(serverCode, localMirror);
    expect(reconciliation.hasLocalRecovery).toBe(true);
    expect(reconciliation.recoveredSource).toBe("int main() { int x = 42; return x; }");
  });

  it("does not trigger recovery when local mirror is already synced with server", () => {
    const serverCode = "int main() { return 0; }";
    const localMirror = {
      sessionId: "session-1",
      sourceCode: "int main() { return 0; }",
      language: "CPP" as const,
      timestamp: Date.now(),
      syncedWithServer: true,
    };

    const reconciliation = reconcileDraftVersions(serverCode, localMirror);
    expect(reconciliation.hasLocalRecovery).toBe(false);
  });

  it("handles null local mirror gracefully", () => {
    const serverCode = "int main() { return 0; }";
    const reconciliation = reconcileDraftVersions(serverCode, null);
    expect(reconciliation.hasLocalRecovery).toBe(false);
  });
});
