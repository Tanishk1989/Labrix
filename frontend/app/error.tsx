"use client";

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useTransition } from "react";
import { Button, ErrorState } from "@/components/design-system";
import { useIdentityMode } from "@/components/identity-mode-provider";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const identityMode = useIdentityMode();
  const [isRetrying, startRetry] = useTransition();

  useEffect(() => {
    console.error("TRACE route rendering failed", error);
  }, [error]);

  const retryAction = (
    <Button
      className="min-h-11"
      loading={isRetrying}
      onClick={() => startRetry(retry)}
    >
      {isRetrying ? "Trying again" : "Try again"}
    </Button>
  );
  const accountAction = identityMode === "clerk" ? (
    <SignOutButton redirectUrl="/sign-in">
      <button className="button-secondary min-h-11" type="button">
        Sign out and switch account
      </button>
    </SignOutButton>
  ) : (
    <Link className="button-secondary min-h-11" href="/sign-in">
      Return to sign in
    </Link>
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-12 sm:px-6">
      <ErrorState
        className="w-full"
        title="Couldn't load this page"
        description="TRACE couldn't reach a required service. Your saved work has not been changed. Try again, or switch accounts if the problem continues."
        action={retryAction}
        secondaryAction={accountAction}
        headingLevel="h1"
      />
    </main>
  );
}
