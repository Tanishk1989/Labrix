import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Labrix",
  description:
    "Teacher-first, process-aware coding labs with actionable evidence and viva guidance.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
