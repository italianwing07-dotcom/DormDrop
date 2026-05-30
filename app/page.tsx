import Link from "next/link";
import { CategoryButtons } from "@/components/category-buttons";
import { ListingCard } from "@/components/listing-card";
import { listings } from "@/lib/listings";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 rounded-[28px] bg-campus-mint p-6 shadow-soft sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-campus-green">
            Campus reuse, made simple
          </p>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-campus-ink sm:text-5xl">
              Find, sell, or give away dorm items before move-out.
            </h1>
            <p className="max-w-xl text-base leading-7 text-campus-ink/75">
              DormDrop helps students exchange lamps, storage bins, mini fridges,
              textbooks, and other campus essentials with people nearby.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/browse"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-campus-green px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-campus-ink"
            >
              Browse listings
            </Link>
            <Link
              href="/create"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-campus-ink shadow-sm transition hover:bg-campus-paper"
            >
              Post an item
            </Link>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-4 shadow-sm">
          <div className="rounded-2xl border border-campus-ink/10 bg-campus-paper p-4">
            <p className="text-sm font-semibold text-campus-ink">This week near campus</p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                ["18", "Free"],
                ["27", "For sale"],
                ["9", "Wanted"]
              ].map(([count, label]) => (
                <div key={label} className="rounded-2xl bg-white p-3">
                  <p className="text-2xl font-bold text-campus-green">{count}</p>
                  <p className="mt-1 text-xs font-medium text-campus-ink/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-campus-green">Quick filters</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Start with what you need</h2>
          </div>
          <CategoryButtons />
        </div>
      </section>

      <section className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Fresh listings</h2>
          <Link href="/browse" className="text-sm font-semibold text-campus-green">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.slice(0, 3).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}
