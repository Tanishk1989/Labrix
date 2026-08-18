import { Skeleton } from "@/components/design-system";

export default function CodingWorkspaceLoading() {
  return (
    <main className="workspace-loading" role="status" aria-label="Loading coding workspace" aria-busy="true">
      <header>
        <div>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-5 w-64 max-w-full" />
          <Skeleton className="mt-2 h-3 w-48 max-w-full" />
        </div>
        <div className="workspace-loading-actions">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </header>
      <div className="workspace-loading-tabs">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="workspace-loading-grid">
        <aside>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-5 h-6 w-52 max-w-full" />
          <Skeleton className="mt-5 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-11/12" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </aside>
        <section aria-label="Editor loading surface">
          <div><Skeleton className="h-3 w-20" /></div>
          <span>Preparing editor…</span>
        </section>
        <footer><Skeleton className="h-4 w-36" /></footer>
      </div>
    </main>
  );
}
