import { cn } from "../../lib/utils";

export function Skeleton({ className, ...props }) {
  return <div className={cn("skeleton h-4 w-full", className)} {...props} />;
}

export function SkeletonTable({ rows = 6, cols = 4 }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-surface">
      <div className="border-b bg-muted/40 p-4">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 p-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cn("h-4", c === 0 ? "w-1/3" : "w-1/5")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-surface p-6">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-20" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

const BAR_HEIGHTS = ["40%", "65%", "50%", "80%", "55%", "90%", "70%"];

export function SkeletonChart({ className }) {
  return (
    <div className={cn("h-64 w-full p-4", className)}>
      <div className="flex h-full items-end gap-3">
        {BAR_HEIGHTS.map((h, i) => (
          <div key={i} className="flex flex-1 items-end">
            <Skeleton className="w-full rounded-md" style={{ height: h }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ rows = 5 }) {
  return (
    <div className="flex flex-col gap-2 p-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-2 py-2">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="mt-1.5 h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDetail({ tiles = 3, rows = 4 }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: tiles }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-surface px-3 py-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border">
        <div className="border-b bg-muted/40 p-3">
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex items-center gap-4 p-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="ml-auto h-4 w-12" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
