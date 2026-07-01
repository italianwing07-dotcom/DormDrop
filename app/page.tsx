import Link from "next/link";
import { CategoryButtons } from "@/components/category-buttons";
import { ListingCard } from "@/components/listing-card";
import { listings } from "@/lib/listings";

export default function HomePage() {
  const activeListings = listings.filter((listing) => !listing.sold).length;
  const campusCount = new Set(listings.map((listing) => listing.campus)).size;
  const photoCount = listings.reduce(
    (count, listing) => count + Math.max(1, listing.images.length),
    0
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-campus-border bg-campus-card shadow-premium">
        <div className="grid gap-6 bg-[linear-gradient(135deg,#1E40AF_0%,#172554_100%)] p-5 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex rounded-[14px] border border-white/20 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-sm">
              Campus reuse, made simple
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                A trusted campus marketplace for dorm essentials.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
                DormDrop helps students give away, sell, and request dorm items by campus, so useful things stay nearby and move-out feels easier.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/browse"
                className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-campus-green px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-campus-hover hover:shadow-lg"
              >
                Browse listings
              </Link>
              <Link
                href="/create"
                className="inline-flex min-h-12 items-center justify-center rounded-[14px] border border-white/25 bg-white/10 px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-md"
              >
                Post an item
              </Link>
            </div>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {[
                ["Campus-based", "Find items around your school."],
                ["Student-first", "Simple posts, clear categories."],
                ["Move-out ready", "Free, for sale, and wanted in one place."]
              ].map(([title, body]) => (
                <div key={title} className="rounded-[14px] border border-white/20 bg-white/10 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/75">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 lg:pl-4">
            <div className="rounded-[20px] border border-campus-border bg-campus-card p-4 shadow-premium">
              <div className="flex items-center justify-between gap-3 border-b border-campus-border pb-3">
                <div>
                  <p className="text-sm font-bold text-campus-green">Live campus board</p>
                  <p className="mt-1 text-xs font-semibold text-campus-muted">Sample activity</p>
                </div>
                <span className="rounded-[14px] bg-campus-successBg px-3 py-1 text-xs font-black text-campus-success">
                  Updated
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {listings.slice(0, 3).map((listing) => (
                  <div key={listing.id} className="flex items-center gap-3 rounded-[14px] bg-campus-paper p-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-campus-card text-sm font-black text-campus-green shadow-sm">
                      {listing.type === "Free" ? "$0" : listing.type === "Wanted" ? "Need" : listing.price}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-campus-ink">{listing.title}</p>
                      <p className="mt-1 truncate text-xs font-semibold text-campus-muted">{listing.campus} / {listing.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                ["3", "Categories"],
                ["6", "Campuses"],
                ["5", "Photos/post"]
              ].map(([count, label]) => (
                <div key={label} className="rounded-[14px] border border-campus-border bg-campus-card p-3 shadow-sm">
                  <p className="text-2xl font-black text-campus-green">{count}</p>
                  <p className="mt-1 text-xs font-semibold text-campus-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          [String(activeListings), "Active listings", "Dorm items currently available or requested."],
          [String(campusCount), "Campuses", "School communities represented on DormDrop."],
          [String(photoCount), "Photos shared", "Real item photos and listing visuals in the marketplace."]
        ].map(([value, label, description]) => (
          <div
            className="rounded-[20px] border border-campus-border bg-campus-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-premium"
            key={label}
          >
            <p className="text-3xl font-black tracking-tight text-campus-green">{value}</p>
            <h2 className="mt-2 text-base font-black text-campus-ink">{label}</h2>
            <p className="mt-2 text-sm leading-6 text-campus-muted">{description}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 rounded-[20px] border border-campus-border bg-campus-card/95 p-5 shadow-soft sm:p-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div>
          <p className="text-sm font-bold text-campus-green">Quick filters</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight">Start with what you need</h2>
          <p className="mt-2 text-sm leading-6 text-campus-muted">
            Browse by Free, For Sale, or Wanted before narrowing by campus.
          </p>
        </div>
        <div className="lg:justify-self-end">
          <CategoryButtons />
        </div>
      </section>

      <section className="space-y-6 pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-campus-green">Fresh listings</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Recently posted around campus</h2>
          </div>
          <Link href="/browse" className="inline-flex min-h-11 items-center rounded-[14px] bg-campus-card px-5 text-sm font-bold text-campus-green shadow-sm transition hover:bg-slate-50 hover:text-campus-hover">
            View all listings
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {listings.slice(0, 3).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </main>
  );
}
