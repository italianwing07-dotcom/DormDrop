import { BrowseListings } from "@/components/browse-listings";
import { getListings } from "@/lib/supabase/listings";

export const dynamic = "force-dynamic";

export default async function BrowsePage() {
  const listings = await getListings();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-campus-green">Browse listings</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Dorm finds around campus
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-campus-ink/70">
            Browse dorm items posted by students around campus.
          </p>
        </div>
        {listings.length > 0 ? (
          <BrowseListings listings={listings} />
        ) : (
          <div className="rounded-3xl border border-campus-ink/10 bg-white p-8 text-center shadow-soft">
            <p className="text-sm font-semibold text-campus-green">No listings found</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight">DormDrop is ready for the first post.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-campus-ink/60">
              Create the first DormDrop listing to fill this page.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
