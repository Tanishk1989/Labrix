import Image from "next/image";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { TraceLogo } from "@/components/trace-logo";

export function PremiumAuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="premium-auth-shell">
      <section className="premium-auth-story" aria-labelledby="auth-story-heading">
        <Link href="/" className="premium-auth-logo" aria-label="TRACE home">
          <TraceLogo size={27} />
        </Link>
        <div className="premium-auth-copy">
          <p className="faculty-kicker">{eyebrow}</p>
          <h1 id="auth-story-heading">{title}</h1>
          <p>{description}</p>
          <ul>
            <li><CheckCircle2 size={15} aria-hidden="true" /> Live Java and C++ execution</li>
            <li><CheckCircle2 size={15} aria-hidden="true" /> Evidence-led practical assessment</li>
            <li><CheckCircle2 size={15} aria-hidden="true" /> Clear progress for every student</li>
          </ul>
        </div>
        <Image
          src="/assets/trace-campus-lines.png"
          width={900}
          height={560}
          alt=""
          aria-hidden="true"
          className="premium-auth-art"
          priority
        />
        <p className="premium-auth-quote">“Teach students to think in algorithms—not just submit code.”</p>
      </section>
      <section className="premium-auth-form" aria-label="Account access">
        <div className="premium-auth-form-inner">{children}</div>
      </section>
    </main>
  );
}
