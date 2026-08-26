import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How TRACE collects, uses, and protects account and classroom data.",
};

const sections = [
  {
    title: "Information TRACE processes",
    body: "TRACE processes account details supplied through Clerk, classroom memberships, practicals, code drafts and submissions, execution results, learning-process events, teacher feedback, and essential security and service logs.",
  },
  {
    title: "How the information is used",
    body: "This information is used to provide authentication, classroom access, code execution, submission history, progress evidence, teacher review, service reliability, and abuse prevention. TRACE does not sell personal information or use classroom activity for advertising.",
  },
  {
    title: "Service providers",
    body: "TRACE relies on carefully selected infrastructure providers for authentication, hosting, databases, code execution, and optional AI-assisted teacher guidance. They process only the information needed to provide those services under their own security and privacy commitments.",
  },
  {
    title: "Academic evidence",
    body: "TRACE presents process evidence to teachers as context, not as an automated accusation or verdict. Teachers remain responsible for academic decisions. TRACE does not record student screens or webcams.",
  },
  {
    title: "Retention and security",
    body: "Information is retained while it is needed to operate the classroom service, preserve academic records, meet security requirements, or resolve disputes. Access is role-aware, and sensitive credentials are not stored in browser code. No internet service can guarantee absolute security.",
  },
  {
    title: "Your choices",
    body: "You may ask to access, correct, or delete personal information, subject to legitimate classroom-record and security obligations. You may also ask questions about how your information is handled.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#070b14] px-6 py-12 text-slate-200 sm:py-16">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-indigo-300">
          TRACE
        </Link>
        <p className="mt-10 text-sm font-medium text-indigo-300">Effective August 26, 2026</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-400">
          TRACE is a programming-lab platform for students and teachers. This policy explains the
          information needed to operate it and the choices available to you.
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
            Privacy questions can be sent to{" "}
            <a className="text-indigo-300 underline underline-offset-4" href="mailto:tanishk1976@gmail.com">
              tanishk1976@gmail.com
            </a>
            .
          </p>
        </section>

        <footer className="mt-14 flex gap-5 border-t border-white/10 pt-7 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-300">Terms of Service</Link>
          <Link href="/" className="hover:text-slate-300">Return to TRACE</Link>
        </footer>
      </article>
    </main>
  );
}
