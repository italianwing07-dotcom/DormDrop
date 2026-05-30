export default function ListingDetailsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="h-5 w-28 rounded-full bg-campus-mint" />
      <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6">
        <div className="aspect-[4/3] rounded-3xl border border-campus-ink/10 bg-campus-mint shadow-soft" />
        <div className="space-y-5">
          <div className="space-y-5 rounded-3xl border border-campus-ink/10 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-full bg-campus-mint" />
              <div className="h-7 w-16 rounded-full bg-campus-mint" />
            </div>
            <div className="h-10 w-3/4 rounded-full bg-campus-mint" />
            <div className="h-5 w-32 rounded-full bg-campus-mint" />
            <div className="space-y-2">
              <div className="h-4 rounded-full bg-campus-mint" />
              <div className="h-4 w-5/6 rounded-full bg-campus-mint" />
            </div>
            <div className="h-12 rounded-full bg-campus-paper" />
          </div>
          <div className="h-44 rounded-3xl border border-campus-ink/10 bg-white shadow-soft" />
        </div>
      </section>
    </main>
  );
}
