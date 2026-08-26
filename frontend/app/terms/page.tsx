import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for using the TRACE programming-lab platform.",
};

const sections = [
  {
    title: "Using TRACE",
    body: "You may use TRACE for legitimate teaching, learning, and programming-lab activities. You must provide accurate account information, protect your account, and follow the rules of your institution and classroom.",
  },
  {
    title: "Student work and teacher content",
    body: "Students retain ownership of their original code. Teachers retain ownership of their original practicals and feedback. You grant TRACE the limited permission needed to store, process, display, execute, and back up that content while providing the service.",
  },
  {
    title: "Acceptable use",
    body: "Do not attack the service, bypass access controls, run malware, interfere with other users, submit unlawful content, misuse another person's account, or use code execution for activities unrelated to assigned learning work.",
  },
  {
    title: "Academic decisions",
    body: "Execution results, similarity indicators, process evidence, and AI-assisted guidance can be incomplete or incorrect. They support teacher judgment and must not be treated as automatic proof of misconduct or as a substitute for institutional review.",
  },
  {
    title: "Availability",
    body: "TRACE is an evolving student-built service and is provided on an as-available basis. Features may change, and temporary interruptions can occur. Important academic work should also be kept in an appropriate backup when required by your institution.",
  },
  {
    title: "Suspension and changes",
    body: "Access may be restricted when necessary to protect users, comply with law, respond to abuse, or enforce classroom access rules. Material changes to these terms will be reflected by updating the effective date on this page.",
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-12 text-slate-200 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-indigo-300">
          TRACE
        </Link>
        <p className="mt-10 text-sm font-medium text-indigo-300">Effective August 26, 2026</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-400">
          These terms describe the responsibilities that keep TRACE useful and safe for programming
          classes.
        </p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-400">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 border-t border-white/10 pt-10">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p className="mt-3 leading-7 text-slate-400">
            Questions about these terms can be sent to{" "}
            <a className="text-indigo-300 underline underline-offset-4" href="mailto:tanishk1976@gmail.com">
              tanishk1976@gmail.com
            </a>
            .
          </p>
        </section>

        <footer className="mt-14 flex gap-5 border-t border-white/10 pt-7 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
          <Link href="/" className="hover:text-slate-300">Return to TRACE</Link>
        </footer>
      </article>
    </main>
  );
}
