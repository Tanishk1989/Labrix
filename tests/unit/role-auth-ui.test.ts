import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RoleAwareSignIn } from "@/components/role-aware-sign-in";
import { RoleAwareSignUp } from "@/components/role-aware-sign-up";

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock("@clerk/nextjs", async () => {
  const React = await import("react");

  return {
    useAuth: mockUseAuth,
    SignIn: ({ signUpUrl, forceRedirectUrl }: { signUpUrl: string; forceRedirectUrl: string }) =>
      React.createElement("div", {
        "data-clerk-component": "sign-in",
        "data-sign-up-url": signUpUrl,
        "data-force-redirect-url": forceRedirectUrl,
      }),
    SignUp: ({ signInUrl, forceRedirectUrl }: { signInUrl: string; forceRedirectUrl: string }) =>
      React.createElement("div", {
        "data-clerk-component": "sign-up",
        "data-sign-in-url": signInUrl,
        "data-force-redirect-url": forceRedirectUrl,
      }),
  };
});

describe("role-aware authentication UI", () => {
  it("offers both Student and Teacher before sign-in", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false });
    const studentMarkup = renderToStaticMarkup(createElement(RoleAwareSignIn, { intent: null }));
    const teacherMarkup = renderToStaticMarkup(createElement(RoleAwareSignIn, { intent: "teacher" }));

    expect(studentMarkup).toMatch(/<option value="student"[^>]*selected="">Student<\/option>/);
    expect(studentMarkup).toMatch(/<option value="teacher"[^>]*>Teacher<\/option>/);
    expect(studentMarkup).toContain("/sign-up?role=student");
    expect(studentMarkup).toContain("/auth/complete?role=student");
    expect(teacherMarkup).toMatch(/<option value="teacher"[^>]*selected="">Teacher<\/option>/);
    expect(teacherMarkup).toContain("/sign-up?role=teacher");
    expect(teacherMarkup).toContain("/auth/complete?role=teacher");
  });

  it("offers an enter-workspace action to an already signed-in user", () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true });

    const studentMarkup = renderToStaticMarkup(createElement(RoleAwareSignIn, { intent: null }));
    const teacherMarkup = renderToStaticMarkup(createElement(RoleAwareSignIn, { intent: "teacher" }));

    expect(studentMarkup).toContain("Enter Student workspace");
    expect(studentMarkup).toContain("/auth/complete?role=student");
    expect(teacherMarkup).toContain("Enter Teacher workspace");
    expect(teacherMarkup).toContain("/auth/complete?role=teacher");
  });

  it("offers both Student and Teacher before sign-up", () => {
    const studentMarkup = renderToStaticMarkup(createElement(RoleAwareSignUp, { intent: null }));
    const teacherMarkup = renderToStaticMarkup(createElement(RoleAwareSignUp, { intent: "teacher" }));

    expect(studentMarkup).toMatch(/<option value="student"[^>]*selected="">Student<\/option>/);
    expect(studentMarkup).toMatch(/<option value="teacher"[^>]*>Teacher<\/option>/);
    expect(studentMarkup).toContain("/sign-in?role=student");
    expect(studentMarkup).toContain("/auth/complete?role=student");
    expect(teacherMarkup).toMatch(/<option value="teacher"[^>]*selected="">Teacher<\/option>/);
    expect(teacherMarkup).toContain("/sign-in?role=teacher");
    expect(teacherMarkup).toContain("/auth/complete?role=teacher");
  });
});
