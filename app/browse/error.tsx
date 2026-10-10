"use client";

export default function BrowseError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-card border border-campus-border bg-campus-card p-6 shadow-card">
        <p className="text-sm font-semibold text-campus-danger">Could not load listings</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">We could not load listings</h1>
        <p className="mt-3 text-sm leading-relaxed text-campus-muted">
          This is usually a connection problem. Try again in a moment.
        </p>
        <button
          className="mt-5 min-h-12 rounded-ctl bg-campus-brand px-6 text-sm font-semibold text-white transition hover:bg-campus-brandHover"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
