import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppShell, useDemoRole } from "@/components/app-shell";
import { IdentityModeProvider } from "@/components/identity-mode-provider";

vi.stubGlobal("React", React);
vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));
vi.mock("@/components/theme-selector", () => ({ ThemeSelector: () => null }));
vi.mock("@/components/command-palette", () => ({ CommandPalette: () => null }));
vi.mock("@/components/account-dropdown", () => ({
  AccountDropdown: ({ name, currentRole }: { name: string; currentRole: string }) =>
    createElement("span", null, `account:${name}:${currentRole}`),
}));

function RoleProbe() {
  return createElement("span", null, `context:${useDemoRole()}`);
}

function renderShell(mode: "demo" | "clerk", role: "teacher" | "student", actorRole: "TEACHER" | "STUDENT") {
  return renderToStaticMarkup(createElement(IdentityModeProvider,
    { mode } as Parameters<typeof IdentityModeProvider>[0],
    createElement(AppShell, {
      role, setRole: () => {}, actor: { name: "Verified User", role: actorRole },
    } as Parameters<typeof AppShell>[0], createElement(RoleProbe)),
  ));
}

describe("verified account role rendering", () => {
  it.each([
    ["student", "TEACHER", "teacher", "Reviews"],
    ["teacher", "STUDENT", "student", "Submissions"],
  ] as const)("ignores stale %s preview for a %s account", (preview, actorRole, actual, navigation) => {
    const html = renderShell("clerk", preview, actorRole);
    expect(html).toContain(`context:${actual}`);
    expect(html).toContain(`account:Verified User:${actual}`);
    expect(html).toContain(`>${navigation}<`);
    expect(html).not.toContain('aria-label="Switch workspace"');
    expect(html).not.toContain("Aarav Mehta");
  });

  it("retains student preview in demo mode", () => {
    const html = renderShell("demo", "student", "TEACHER");
    expect(html).toContain("context:student");
    expect(html).toContain("account:Aarav Mehta:student");
    expect(html).toContain('aria-label="Switch workspace"');
  });
});
