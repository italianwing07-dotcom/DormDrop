export function ListingCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-card border border-campus-border bg-campus-card shadow-card">
      <div className="aspect-[4/3] animate-pulse bg-campus-surface" />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-5 w-3/4 rounded-ctl bg-campus-surface" />
            <div className="h-4 w-1/2 rounded-ctl bg-campus-surface" />
          </div>
          <div className="h-7 w-16 rounded-ctl bg-campus-surface" />
        </div>
        <div className="space-y-2">
          <div className="h-4 rounded-ctl bg-campus-surface" />
          <div className="h-4 w-5/6 rounded-ctl bg-campus-surface" />
        </div>
        <div className="flex items-center justify-between border-t border-campus-border pt-3">
          <div className="h-6 w-16 rounded-ctl bg-campus-surface" />
          <div className="h-10 w-20 rounded-ctl bg-campus-surface" />
        </div>
      </div>
    </article>
  );
}
