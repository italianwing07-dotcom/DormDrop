export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-campus-border bg-campus-card shadow-premium">
        <div className="grid gap-6 bg-[linear-gradient(135deg,#1E40AF_0%,#172554_100%)] p-5 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div className="space-y-5">
            <div className="h-9 w-48 animate-pulse rounded-[14px] bg-white/15" />
            <div className="h-28 max-w-2xl animate-pulse rounded-[20px] bg-white/15" />
            <div className="h-12 w-40 animate-pulse rounded-[14px] bg-white/20" />
          </div>
          <div className="min-h-64 animate-pulse rounded-[20px] bg-white/15" />
        </div>
      </section>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-80 animate-pulse rounded-[20px] border border-campus-border bg-campus-card shadow-soft" />
        ))}
      </div>
    </main>
  );
}
