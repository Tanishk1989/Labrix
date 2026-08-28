import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RoleAwareSignIn } from "@/components/role-aware-sign-in";
import { RoleAwareSignUp } from "@/components/role-aware-sign-up";

describe("role-aware authentication UI", () => {
  it("offers both Student and Teacher before sign-in", () => {
    const markup = renderToStaticMarkup(createElement(RoleAwareSignIn, { intent: null }));
    expect(markup).toContain("Sign in as teacher");
    expect(markup).toContain("Sign in as student");
    expect(markup).toContain("/sign-in?role=teacher");
    expect(markup).toContain("/sign-in?role=student");
  });

  it("offers both Student and Teacher before sign-up", () => {
    const markup = renderToStaticMarkup(createElement(RoleAwareSignUp, { intent: null }));
    expect(markup).toContain("Create a teacher account");
    expect(markup).toContain("Create a student account");
    expect(markup).toContain("/sign-up?role=teacher");
    expect(markup).toContain("/sign-up?role=student");
  });
});
