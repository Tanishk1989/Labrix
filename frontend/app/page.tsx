import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/landing-page";

export const metadata: Metadata = {
  title: "TRACE | Evidence-led coding practicals",
  description:
    "Create coding practicals, evaluate immutable submissions, and run evidence-led oral defenses without surveillance.",
};

export default function RootPage() {
  return <LandingPage />;
}
