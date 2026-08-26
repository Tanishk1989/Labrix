import Link from "next/link";
import {
  ArrowRight,
  Binary,
  BookOpenCheck,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  FileSearch2,
  GitCompareArrows,
  Menu,
  MessageSquareCode,
  Play,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Users,
} from "lucide-react";
import { TraceMark } from "@/components/trace-logo";

const workflowSteps = [
  {
    number: "01",
    icon: BookOpenCheck,
    title: "Author the practical",
    description:
      "Define starter code, visible and hidden tests, marks, and rubric criteria in one focused workflow.",
    tone: "text-indigo-300 bg-indigo-400/10 border-indigo-400/20",
  },
  {
    number: "02",
    icon: FileSearch2,
    title: "Trace the evidence",
    description:
      "Capture immutable attempts, execution results, structural signals, and the path each student took.",
    tone: "text-cyan-300 bg-cyan-400/10 border-cyan-400/20",
  },
  {
    number: "03",
    icon: MessageSquareCode,
    title: "Review with context",
    description:
      "Turn code evidence into precise feedback, marks, and oral-defense questions without losing teacher judgment.",
    tone: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
  },
];

const trustPoints = [
  "Immutable submission attempts",
  "Server-owned execution results",
  "Evidence-led oral defense",
  "No screen or webcam recording",
];

const proofMetrics = [
  { value: "2", label: "isolated language runtimes", tone: "text-indigo-400" },
  { value: "5", label: "foundation evidence signals", tone: "text-cyan-400" },
  { value: "0", label: "surveillance recordings", tone: "text-emerald-400" },
  { value: "1", label: "teacher-owned review trail", tone: "text-amber-400" },
];

function LandingHeader() {
  return (
    <>
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-50 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black focus:not-sr-only">
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <div className="mx-auto flex h-14 max-w-[118rem] items-center justify-between rounded-2xl border border-white/[0.08] bg-[#070910]/90 px-3 shadow-[0_12px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:px-4">
        <Link href="/" className="group inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" aria-label="TRACE home">
          <span className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] transition-colors group-hover:border-white/20">
            <TraceMark size={19} />
          </span>
          <span className="text-sm font-semibold tracking-[-0.02em] text-white">
            TRACE
          </span>
        </Link>

        <nav aria-label="Landing page navigation" className="hidden items-center gap-1 md:flex">
          <a href="#workflow" className="rounded-lg px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">Workflow</a>
          <a href="#evidence" className="rounded-lg px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">Evidence</a>
          <a href="#integrity" className="rounded-lg px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">Integrity</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="hidden min-h-9 items-center rounded-lg px-3 text-xs font-semibold text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:inline-flex">
            Sign in
          </Link>
          <Link href="/sign-in" className="group inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-indigo-500 px-3.5 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(79,70,229,0.25)] transition-all hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070910]">
                Open TRACE
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <a href="#workflow" aria-label="Jump to workflow" className="grid size-9 place-items-center rounded-lg border border-white/10 text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 md:hidden">
            <Menu size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
      </header>
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-5 pb-28 pt-24 sm:pb-36 sm:pt-32 lg:pb-44 lg:pt-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_18%_10%,rgba(59,130,246,0.18),transparent_38%),radial-gradient(circle_at_82%_8%,rgba(249,115,22,0.14),transparent_40%)]" aria-hidden="true" />
      <div className="relative mx-auto max-w-[96rem] text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/15 bg-indigo-400/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300">
          <Sparkles size={12} aria-hidden="true" />
          Evidence-assisted coding practicals
        </div>
        <h1 className="mx-auto mt-6 max-w-[96rem] text-balance text-[clamp(3rem,7vw,7.5rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-white">
          Trace the work.
          <span className="mt-2 block bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Understand the learning.
          </span>
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-balance text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
          TRACE helps instructors create coding practicals, evaluate immutable submissions, and run evidence-led oral defenses—without turning the lab into surveillance.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/sign-in" className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(79,70,229,0.3)] transition-all hover:-translate-y-0.5 hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050609] sm:w-auto">
                  Get started
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <a href="#evidence" className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-5 text-sm font-semibold text-white/80 transition-all hover:border-white/20 hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 sm:w-auto">
            <Play size={14} fill="currentColor" aria-hidden="true" />
            See how it works
          </a>
        </div>
        <p className="mt-5 text-xs text-white/60">Built for programming labs, practical assessment, and oral defense.</p>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section id="workflow" className="scroll-mt-24 px-5 py-24 sm:py-28">
      <div className="mx-auto max-w-[88rem]">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-indigo-400">The workflow</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">From practical to proof.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base">One continuous assessment loop, with the instructor in control at every step.</p>
        </div>

        <ol className="mt-14 grid border-y border-white/[0.07] md:grid-cols-3">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.number} className={`group relative px-1 py-8 md:px-7 md:py-10 ${index < workflowSteps.length - 1 ? "border-b border-white/[0.07] md:border-b-0 md:border-r" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className={`grid size-9 place-items-center rounded-xl border ${step.tone}`}>
                    <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.12em] text-white/60">{step.number}</span>
                </div>
                <h3 className="mt-7 text-base font-semibold tracking-[-0.02em] text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">{step.description}</p>
                <span className="mt-7 inline-flex items-center gap-1 text-xs font-semibold text-white/70 transition-colors group-hover:text-indigo-300">
                  See the workflow <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function EvidenceSection() {
  return (
    <section id="evidence" className="scroll-mt-24 px-5 py-24 sm:py-32">
      <div className="mx-auto max-w-[88rem] overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#090b12] shadow-[0_32px_90px_rgba(0,0,0,0.42)]">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex flex-col justify-between overflow-hidden border-b border-white/[0.07] p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(99,102,241,0.14),transparent_45%)]" aria-hidden="true" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                <CircleGauge size={13} aria-hidden="true" />
                Example instructor view
              </div>
              <h2 className="mt-6 max-w-md text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-5xl">
                A review queue that explains itself.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
                Surface who is waiting, what needs attention, and which evidence is ready—before the instructor opens a single submission.
              </p>
            </div>

            <div className="relative mt-12 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full border border-amber-300/20 bg-amber-300/10 text-amber-300"><FileSearch2 size={16} aria-hidden="true" /></span>
              <div>
                <p className="text-sm font-semibold text-white">Prioritized review queue</p>
                <p className="mt-0.5 text-xs text-white/60">Driven by real submission status</p>
              </div>
            </div>
          </div>

          <div className="bg-[#06070b] p-4 sm:p-7 lg:p-9">
            <div className="rounded-2xl border border-white/[0.08] bg-[#0c101a] shadow-[0_24px_60px_rgba(0,0,0,0.36)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-7 place-items-center rounded-lg bg-indigo-400/10 text-indigo-300"><TerminalSquare size={14} aria-hidden="true" /></span>
                  <div>
                    <p className="text-xs font-semibold text-white">Student submission</p>
                    <p className="text-[10px] text-white/60">Latest attempt · Java</p>
                  </div>
                </div>
                <span className="rounded-full border border-amber-300/15 bg-amber-300/[0.07] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-amber-300">Needs review</span>
              </div>

              <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                <div className="border-b border-white/[0.07] p-4 sm:p-5 lg:border-b-0 lg:border-r">
                  <div className="mb-3 flex items-center justify-between text-[10px] text-white/60">
                    <span className="inline-flex items-center gap-1.5"><Braces size={12} aria-hidden="true" /> solution.java</span>
                    <span>12 lines</span>
                  </div>
                  <pre aria-label="Illustrative Java submission" className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#06080d] p-4 font-mono text-[10px] leading-5 text-white/70 sm:text-[11px]">
                    <code><span className="text-indigo-300">public int</span> search(Node root, <span className="text-cyan-300">int</span> key) &#123;{"\n"}  <span className="text-indigo-300">while</span> (root != <span className="text-rose-300">null</span>) &#123;{"\n"}    <span className="text-indigo-300">if</span> (root.value == key) <span className="text-indigo-300">return</span> key;{"\n"}    root = key &lt; root.value{"\n"}      ? root.left : root.right;{"\n"}  &#125;{"\n"}  <span className="text-indigo-300">return</span> -1;{"\n"}&#125;</code>
                  </pre>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-400/[0.07] px-2 py-1 text-[9px] font-medium text-emerald-300"><CheckCircle2 size={10} aria-hidden="true" /> 5/6 tests</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-cyan-400/[0.07] px-2 py-1 text-[9px] font-medium text-cyan-300"><GitCompareArrows size={10} aria-hidden="true" /> Structure captured</span>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">Evidence summary</p>
                  <div className="mt-4 space-y-4">
                    {[
                      ["Execution", "5 of 6 tests passed", "83%"],
                      ["Approach", "Iterative traversal", "Clear"],
                      ["Defense", "2 questions ready", "Ready"],
                    ].map(([label, detail, value]) => (
                      <div key={label} className="border-b border-white/[0.06] pb-3 last:border-b-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-white/70">{label}</span>
                          <span className="font-mono text-[10px] text-cyan-300">{value}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-white/60">{detail}</p>
                      </div>
                    ))}
                  </div>
                  <Link href="/sign-in" className="group mt-5 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-500 text-xs font-semibold text-white transition-colors hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
                    Review evidence <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IntegritySection() {
  return (
    <section id="integrity" className="scroll-mt-24 px-5 py-24 sm:py-32">
      <div className="mx-auto grid max-w-[88rem] items-center gap-14 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
        <div>
          <span className="grid size-9 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-300"><ShieldCheck size={18} aria-hidden="true" /></span>
          <h2 className="mt-7 max-w-xl text-balance text-4xl font-semibold leading-[1.03] tracking-[-0.05em] text-white sm:text-5xl">
            Academic integrity without <span className="text-indigo-400">surveillance.</span>
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
            TRACE builds confidence from code, execution, structure, and conversation. It helps teachers ask better questions without recording screens, webcams, or private student behavior.
          </p>
          <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
            {trustPoints.map((point) => (
              <li key={point} className="flex min-h-12 items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.018] px-3.5 text-xs font-medium text-white/70">
                <Check size={13} className="shrink-0 text-emerald-400" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-8 rounded-full bg-indigo-500/10 blur-3xl" aria-hidden="true" />
          <div className="relative rounded-[2rem] border border-white/[0.08] bg-[#0b0d16] p-5 shadow-[0_35px_100px_rgba(0,0,0,0.5)] sm:p-7">
            <div className="rounded-[1.6rem] border border-indigo-400/15 bg-indigo-500/[0.08] px-7 py-12 text-center">
              <span className="mx-auto grid size-24 place-items-center rounded-[1.75rem] border border-indigo-400/20 bg-indigo-500/10 text-indigo-400 shadow-[0_20px_60px_rgba(79,70,229,0.2)]">
                <ShieldCheck size={46} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <p className="mt-7 text-sm font-semibold text-white">Evidence, not observation</p>
              <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-white/60">Student work stays reviewable. Student privacy stays intact.</p>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3.5 py-3">
              <span className="inline-flex items-center gap-2 text-[10px] font-medium text-white/70"><Binary size={12} className="text-cyan-400" aria-hidden="true" /> Evidence engine</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-400" /> Active</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofSection() {
  return (
    <section className="px-5 py-24 sm:py-28">
      <div className="mx-auto max-w-[88rem]">
        <div className="text-center">
          <span className="mx-auto grid size-8 place-items-center rounded-full border border-indigo-400/15 bg-indigo-400/[0.07] text-indigo-300"><Users size={14} aria-hidden="true" /></span>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/60">Designed around accountable assessment</p>
        </div>
        <dl className="mt-12 grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {proofMetrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <dd className={`text-4xl font-semibold tracking-[-0.05em] sm:text-5xl ${metric.tone}`}>{metric.value}</dd>
              <dt className="mx-auto mt-3 max-w-32 text-[9px] font-semibold uppercase leading-4 tracking-[0.1em] text-white/60">{metric.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="border-t border-white/[0.06] bg-[#0a0912] px-5 py-28 sm:py-36">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-balance text-4xl font-semibold leading-[1] tracking-[-0.055em] text-white sm:text-6xl">
          Practical assessment should reveal
          <span className="mx-auto mt-2 block w-fit border-b-4 border-cyan-400 pb-1 text-indigo-400">how students think.</span>
        </h2>
        <p className="mx-auto mt-7 max-w-xl text-sm leading-6 text-white/70 sm:text-base">Create the lab, publish the practical, and review real code evidence with complete academic integrity.</p>
          <Link href="/sign-in" className="group mt-9 inline-flex min-h-12 items-center gap-2 rounded-xl bg-indigo-500 px-6 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(79,70,229,0.28)] transition-all hover:-translate-y-0.5 hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">
          Get started with TRACE
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050609] text-white selection:bg-indigo-500/35">
      <LandingHeader />
      <main id="main-content">
        <HeroSection />
        <WorkflowSection />
        <EvidenceSection />
        <IntegritySection />
        <ProofSection />
        <FinalCta />
      </main>
      <footer className="border-t border-white/[0.06] bg-[#050609] px-5 py-7">
        <div className="mx-auto flex max-w-[88rem] flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300" aria-label="TRACE home">
            <TraceMark size={18} />
            <span className="text-xs font-semibold tracking-[0.08em] text-white/70">TRACE</span>
          </Link>
          <p className="text-[10px] text-white/60">Trace the work, not the screen.</p>
          <Link href="/sign-in" className="inline-flex items-center gap-1 rounded-lg text-[10px] font-semibold text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300">Instructor sign in <ChevronRight size={11} aria-hidden="true" /></Link>
        </div>
      </footer>
    </div>
  );
}
