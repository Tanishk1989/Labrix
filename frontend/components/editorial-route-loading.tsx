import { LoadingState, Skeleton } from "@/components/design-system";

type EditorialLoadingVariant =
  | "dashboard"
  | "classes"
  | "practicals"
  | "review"
  | "review-detail"
  | "progress";

function HeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-9 w-full max-w-md" />
      <Skeleton className="h-4 w-full max-w-xl" />
    </div>
  );
}

function RowSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-4 border-t border-[var(--border)] py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="space-y-2">
        <Skeleton className="h-4 w-48 max-w-full" />
        <Skeleton className="h-3 w-72 max-w-full" />
      </div>
      <Skeleton className={compact ? "h-3 w-20" : "h-7 w-28"} />
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="grid gap-6 border-y border-[var(--border)] py-7 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className={index === 0 ? "h-10 w-24" : "h-7 w-20"} />
          <Skeleton className="h-3 w-36 max-w-full" />
        </div>
      ))}
    </div>
  );
}

export function EditorialRouteLoading({ variant }: { variant: EditorialLoadingVariant }) {
  const label = variant === "review-detail"
    ? "Loading submission"
    : variant === "review"
      ? "Loading submissions"
      : `Loading ${variant}`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[80rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <LoadingState title={label} description="The page is being prepared.">
        <div className="space-y-9">
          <HeaderSkeleton />

          {variant === "dashboard" || variant === "progress" ? <SummarySkeleton /> : null}

          {variant === "practicals" || variant === "review" ? (
            <div className="grid gap-3 border-y border-[var(--border)] py-4 sm:grid-cols-3">
              <Skeleton className="h-11 sm:col-span-2" />
              <Skeleton className="h-11" />
            </div>
          ) : null}

          {variant === "review-detail" ? (
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem]">
              <div className="space-y-4 border-y border-[var(--border)] py-5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-72 w-full" />
              </div>
              <div className="space-y-4 border-y border-[var(--border)] py-5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          ) : (
            <div>
              <Skeleton className="mb-4 h-5 w-44" />
              <RowSkeleton compact={variant === "classes"} />
              <RowSkeleton compact={variant === "classes"} />
              <RowSkeleton compact={variant === "classes"} />
            </div>
          )}
        </div>
      </LoadingState>
    </main>
  );
}
