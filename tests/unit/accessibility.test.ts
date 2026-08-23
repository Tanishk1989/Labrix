import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

describe("Accessibility & WCAG AA Compliance Validation", () => {
  it("ensures mobile auth pages have explicit accessible names and status roles for loading", () => {
    const signInPath = join(process.cwd(), "frontend/app/sign-in/[[...sign-in]]/page.tsx");
    const signUpPath = join(process.cwd(), "frontend/app/sign-up/[[...sign-up]]/page.tsx");

    expect(existsSync(signInPath)).toBe(true);
    expect(existsSync(signUpPath)).toBe(true);

    const signInContent = readFileSync(signInPath, "utf8");
    const signUpContent = readFileSync(signUpPath, "utf8");

    // Must have role="status" and aria-label on skeletons
    expect(signInContent).toContain('role="status"');
    expect(signInContent).toContain('aria-label="Loading authentication form"');

    expect(signUpContent).toContain('role="status"');
    expect(signUpContent).toContain('aria-label="Loading registration form"');
  });

  it("ensures landing page interactive elements have focus rings and aria labels", () => {
    const landingPath = join(process.cwd(), "frontend/features/landing/landing-page.tsx");
    expect(existsSync(landingPath)).toBe(true);

    const content = readFileSync(landingPath, "utf8");

    // Links and buttons must have focus-visible styling
    expect(content).toContain("focus-visible:ring-2");
    expect(content).toContain('aria-label="TRACE home"');
    expect(content).toContain('aria-label="Landing page navigation"');
    expect(content).toContain('aria-hidden="true"');
  });

  it("ensures dark theme text contrast adheres to minimum WCAG AA standards (no unreadable text-white/25)", () => {
    const landingPath = join(process.cwd(), "frontend/features/landing/landing-page.tsx");
    const content = readFileSync(landingPath, "utf8");

    // Low contrast text-white/25 and text-white/35 should be elevated
    expect(content).not.toContain("text-white/25");
    expect(content).not.toContain("text-white/35");
    expect(content).not.toContain("text-white/32");
  });

  it("ensures dialogs and modals contain proper ARIA attributes", () => {
    const dialogPath = join(process.cwd(), "frontend/components/dialog.tsx");
    if (existsSync(dialogPath)) {
      const content = readFileSync(dialogPath, "utf8");
      expect(content).toMatch(/role=["']dialog["']|aria-modal/);
    }
  });

  it("ensures quick start guide has accessible heading landmarks and live regions", () => {
    const guidePath = join(process.cwd(), "frontend/features/dashboard/teacher-quick-start-guide.tsx");
    expect(existsSync(guidePath)).toBe(true);

    const content = readFileSync(guidePath, "utf8");
    expect(content).toContain('aria-labelledby="quickstart-heading"');
    expect(content).toContain('aria-live="polite"');
    expect(content).toContain('aria-label="Dismiss getting started guide"');
  });
});
