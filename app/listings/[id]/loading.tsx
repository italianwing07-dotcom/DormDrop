export default function ListingDetailsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-5 w-28 rounded-ctl bg-campus-surface" />
      <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        <div className="aspect-[4/3] rounded-card border border-campus-border bg-campus-surface shadow-card" />
        <div className="space-y-5">
          <div className="space-y-5 rounded-card border border-campus-border bg-campus-card p-5 shadow-card sm:p-6">
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-ctl bg-campus-surface" />
              <div className="h-7 w-16 rounded-ctl bg-campus-surface" />
            </div>
            <div className="h-10 w-3/4 rounded-ctl bg-campus-surface" />
            <div className="h-5 w-32 rounded-ctl bg-campus-surface" />
            <div className="space-y-2">
              <div className="h-4 rounded-ctl bg-campus-surface" />
              <div className="h-4 w-5/6 rounded-ctl bg-campus-surface" />
            </div>
            <div className="h-12 rounded-ctl bg-campus-paper" />
          </div>
          <div className="h-44 rounded-card border border-campus-border bg-campus-card shadow-card" />
        </div>
      </section>
    </main>
  );
}
