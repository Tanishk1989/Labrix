import { createElement, type ComponentType, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Dialog } from "@/components/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/design-system";

describe("shared product states", () => {
  it("renders only real linked empty-state actions", () => {
    const linked = renderToStaticMarkup(createElement(EmptyState, {
      title: "No practicals yet",
      description: "Create your first practical.",
      actionLabel: "Create practical",
      actionHref: "/classes/class-1/tasks/new",
    }));
    const decorative = renderToStaticMarkup(createElement(EmptyState, {
      title: "No practicals yet",
      description: "Create your first practical.",
      actionLabel: "Decorative action",
    }));

    expect(linked).toContain('href="/classes/class-1/tasks/new"');
    expect(decorative).not.toContain("Decorative action");
  });

  it("exposes calm loading semantics without a spinning loader", () => {
    const markup = renderToStaticMarkup(createElement(LoadingState, {
      title: "Loading progress",
      description: "The page is being prepared.",
    }));

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Loading progress");
    expect(markup).not.toContain("animate-spin");
  });

  it("uses factual default error language and an alert role", () => {
    const markup = renderToStaticMarkup(createElement(ErrorState, {
      description: "The page could not be loaded right now.",
    }));

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Couldn&#x27;t load this content");
    expect(markup).not.toContain("Something went wrong");
  });

  it("allows full-page states to expose a page-level heading", () => {
    const markup = renderToStaticMarkup(createElement(ErrorState, {
      title: "Couldn't load this page",
      description: "Try again.",
      headingLevel: "h1",
    }));

    expect(markup).toContain("<h1");
    expect(markup).toContain("Couldn&#x27;t load this page");
  });

  it("gives dialogs a real click-outside close control", () => {
    const TestDialog = Dialog as ComponentType<{
      title: string;
      onClose: () => void;
      children?: ReactNode;
    }>;
    const markup = renderToStaticMarkup(createElement(
      TestDialog,
      {
        title: "Create classroom",
        onClose: () => undefined,
      },
      createElement("p", null, "Classroom details"),
    ));

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain('aria-label="Close dialog"');
  });
});
