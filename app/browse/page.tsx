import { BrowseListings } from "@/components/browse-listings";
import { getListings } from "@/lib/supabase/listings";

export const dynamic = "force-dynamic";

type BrowsePageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const listings = await getListings();
  const resolvedSearchParams = await searchParams;
  const initialSearchTerm = resolvedSearchParams?.q ?? "";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <section className="space-y-6">
        <div className="rounded-[20px] border border-campus-border bg-[linear-gradient(135deg,#1E40AF_0%,#172554_100%)] p-5 shadow-premium sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-white/85">Browse listings</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
                Find dorm items from students nearby.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                Search by item, filter by campus, and browse Free, For Sale, and Wanted posts from the DormDrop community.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center sm:w-80">
              {[
                [String(listings.length), "Total"],
                [String(listings.filter((listing) => !listing.sold).length), "Active"],
                [String(new Set(listings.map((listing) => listing.campus)).size), "Campuses"]
              ].map(([count, label]) => (
                <div key={label} className="rounded-[14px] bg-white/10 p-3 backdrop-blur">
                  <p className="text-xl font-black text-white">{count}</p>
                  <p className="mt-1 text-xs font-bold text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {listings.length > 0 ? (
          <BrowseListings initialSearchTerm={initialSearchTerm} listings={listings} />
        ) : (
          <div className="rounded-[20px] border border-campus-border bg-campus-card p-8 text-center shadow-soft sm:p-10">
            <p className="text-sm font-bold text-campus-green">No listings found</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">DormDrop is ready for the first post.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-campus-muted">
              Create the first DormDrop listing to fill this page with useful dorm items.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
