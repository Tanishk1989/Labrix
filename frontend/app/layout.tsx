import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { IdentityModeProvider } from "@/components/identity-mode-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/components/notification-provider";
import { getIdentityMode } from "@/server/actors/identity-mode";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TRACE | Lab OS",
    template: "%s · TRACE",
  },
  description:
    "Trace the work, not the screen. TRACE is a programming lab platform for creating practicals, running code, reviewing submissions, and understanding how students work.",
  applicationName: "TRACE",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const mode = getIdentityMode();
  const content = (
    <ThemeProvider>
      <IdentityModeProvider mode={mode}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </IdentityModeProvider>
    </ThemeProvider>
  );
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {mode === "clerk" && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
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
