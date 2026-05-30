"use client";

export default function BrowseError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-campus-ink/10 bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold text-campus-coral">Could not load listings</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Supabase returned an error</h1>
        <p className="mt-3 text-sm leading-6 text-campus-ink/70">{error.message}</p>
        <button
          className="mt-5 min-h-12 rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
