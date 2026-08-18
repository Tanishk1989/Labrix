export const workspacePanels = ["problem", "code", "results", "hints"] as const;

export type WorkspacePanel = (typeof workspacePanels)[number];
export type WorkspacePanelNavigationKey = "ArrowLeft" | "ArrowRight" | "Home" | "End";

export function nextWorkspacePanel(
  currentPanel: WorkspacePanel,
  key: WorkspacePanelNavigationKey,
): WorkspacePanel {
  if (key === "Home") return workspacePanels[0];
  if (key === "End") return workspacePanels[workspacePanels.length - 1];

  const currentIndex = workspacePanels.indexOf(currentPanel);
  const direction = key === "ArrowRight" ? 1 : -1;
  return workspacePanels[(currentIndex + direction + workspacePanels.length) % workspacePanels.length];
}
