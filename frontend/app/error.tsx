"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/design-system";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("TRACE route rendering failed", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-12 sm:px-6">
      <ErrorState
        className="w-full"
        title="Couldn't load this page"
        description="The page could not be loaded right now. Your saved work has not been changed."
        actionLabel="Try again"
        onAction={retry}
        headingLevel="h1"
      />
    </main>
  );
}
