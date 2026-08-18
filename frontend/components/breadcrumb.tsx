import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import React from "react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb navigation" className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)]">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors" aria-label="Home">
        <Home size={13} aria-hidden="true" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          <ChevronRight size={12} className="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--text-primary)] font-medium transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-[var(--text-primary)]" aria-current="page">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
