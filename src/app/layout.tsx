import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { IdentityModeProvider } from "@/components/identity-mode-provider";
import { getIdentityMode } from "@/server/actors/identity-mode";
import "./globals.css";

export const metadata: Metadata = {
  title: "Labrix",
  description:
    "Teacher-first, process-aware coding labs with actionable evidence and viva guidance.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const mode = getIdentityMode();
  const content = (
    <IdentityModeProvider mode={mode}>{children}</IdentityModeProvider>
  );
  return (
    <html lang="en">
      <body>
        {mode === "clerk" ? (
          <ClerkProvider
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/classes"
            signUpFallbackRedirectUrl="/classes"
          >
            {content}
          </ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
