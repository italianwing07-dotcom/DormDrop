"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { getCampusFilterOptions, getCampusFilterValue } from "@/lib/campuses";
import type { Listing } from "@/lib/listings";

type CategoryFilter = "All" | Listing["type"];

const filters: CategoryFilter[] = ["All", "Free", "For Sale", "Wanted"];

const filterStyles: Record<CategoryFilter, string> = {
  All: "bg-campus-hover text-white",
  Free: "border border-campus-border bg-campus-card text-campus-ink",
  "For Sale": "bg-campus-gold text-campus-ink",
  Wanted: "bg-slate-50 text-campus-green"
};

export function BrowseListings({
  listings,
  initialSearchTerm = ""
}: {
  listings: Listing[];
  initialSearchTerm?: string;
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("All");
  const [activeCampusFilter, setActiveCampusFilter] = useState("All");
  const [includeSold, setIncludeSold] = useState(false);

  const campusFilters = useMemo(() => getCampusFilterOptions(), []);

  const filteredListings = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesSold = includeSold || !listing.sold;
      const matchesCategory =
        activeFilter === "All" || listing.type === activeFilter;
      const matchesCampus =
        activeCampusFilter === "All" ||
        getCampusFilterValue(listing.campus) === activeCampusFilter;
      const searchableText = (listing.title + " " + listing.description).toLowerCase();
      const matchesSearch =
        !normalizedSearchTerm || searchableText.includes(normalizedSearchTerm);

      return matchesSold && matchesCategory && matchesCampus && matchesSearch;
    });
  }, [activeCampusFilter, activeFilter, includeSold, listings, searchTerm]);

  return (
    <>
      <div className="rounded-[20px] border border-campus-border bg-campus-card/95 p-4 shadow-soft sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-center">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-campus-muted">Search marketplace</span>
            <input
              className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-paper px-4 text-base font-semibold outline-none transition placeholder:font-medium placeholder:text-campus-muted focus:border-campus-green focus:bg-campus-card focus:ring-4 focus:ring-campus-green/10 sm:text-sm"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search for fridges, chairs, books..."
              type="search"
              value={searchTerm}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-campus-muted">Campus</span>
            <select
              className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-paper px-4 text-sm font-bold text-campus-ink outline-none transition focus:border-campus-green focus:bg-campus-card focus:ring-4 focus:ring-campus-green/10"
              onChange={(event) => setActiveCampusFilter(event.target.value)}
              value={activeCampusFilter}
            >
              <option value="All">All campuses</option>
              {campusFilters.map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-12 w-full items-center justify-center gap-3 rounded-[14px] bg-campus-paper px-4 text-sm font-bold text-campus-ink lg:w-fit">
            <input
              checked={includeSold}
              className="size-4 accent-campus-green"
              onChange={(event) => setIncludeSold(event.target.checked)}
              type="checkbox"
            />
            Include sold
          </label>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 sm:pb-1">
            {filters.map((filter) => {
              const isActive = activeFilter === filter;

              return (
                <button
                  className={"min-h-12 shrink-0 rounded-[14px] px-5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 sm:min-h-11 " +
                    (isActive ? filterStyles[filter] : "bg-campus-paper text-campus-ink hover:bg-slate-50 hover:text-campus-green")}
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  type="button"
                >
                  {filter}
                </button>
              );
            })}
          </div>
          <p className="rounded-[14px] bg-slate-50 px-4 py-2 text-sm font-black text-campus-green">
            {filteredListings.length} matching {filteredListings.length === 1 ? "listing" : "listings"}
          </p>
        </div>
      </div>

      {filteredListings.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-campus-border bg-campus-card p-8 text-center shadow-soft sm:p-10">
          <p className="text-sm font-bold text-campus-green">No listings found</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Nothing matches this search yet.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-campus-muted">
            Try a different keyword, switch categories, change campuses, or include sold listings to widen the results.
          </p>
        </div>
      )}
    </>
  );
}
