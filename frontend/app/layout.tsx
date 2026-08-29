import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { IdentityModeProvider } from "@/components/identity-mode-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { getIdentityMode } from "@/server/actors/identity-mode";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TRACE",
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
  const socialConnectionsEnabled =
    process.env.NEXT_PUBLIC_CLERK_SOCIAL_CONNECTIONS_ENABLED === "true";
  const clerkAppearance = socialConnectionsEnabled
    ? dark
    : {
        ...dark,
        elements: {
          ...dark.elements,
          socialButtonsBlockButton: { display: "none" },
          dividerRow: { display: "none" },
        },
      };
  const clerkLocalization = {
    signIn: {
      start: {
        title: "Sign in to TRACE",
        titleCombined: "Continue to TRACE",
      },
    },
    signUp: {
      start: {
        title: "Create your TRACE account",
        titleCombined: "Create your TRACE account",
      },
    },
  };
  const content = (
    <ThemeProvider>
      <IdentityModeProvider mode={mode}>
        {children}
      </IdentityModeProvider>
    </ThemeProvider>
  );
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        {mode === "clerk" && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
            appearance={clerkAppearance as never}
            localization={clerkLocalization}
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
