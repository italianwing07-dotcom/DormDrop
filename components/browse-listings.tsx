"use client";

import { useMemo, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import type { Listing } from "@/lib/listings";

type CategoryFilter = "All" | Listing["type"];

const filters: CategoryFilter[] = ["All", "Free", "For Sale", "Wanted"];

const filterStyles: Record<CategoryFilter, string> = {
  All: "bg-campus-ink text-white",
  Free: "bg-campus-green text-white",
  "For Sale": "bg-campus-gold text-campus-ink",
  Wanted: "bg-campus-coral text-white"
};

export function BrowseListings({ listings }: { listings: Listing[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>("All");
  const [includeSold, setIncludeSold] = useState(false);

  const filteredListings = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesSold = includeSold || !listing.sold;
      const matchesCategory =
        activeFilter === "All" || listing.type === activeFilter;
      const searchableText = `${listing.title} ${listing.description}`.toLowerCase();
      const matchesSearch =
        !normalizedSearchTerm || searchableText.includes(normalizedSearchTerm);

      return matchesSold && matchesCategory && matchesSearch;
    });
  }, [activeFilter, includeSold, listings, searchTerm]);

  return (
    <>
      <label className="block">
        <span className="sr-only">Search listings</span>
        <input
          className="min-h-12 w-full rounded-2xl border border-campus-ink/15 bg-white px-4 text-sm outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search for fridges, chairs, books..."
          type="search"
          value={searchTerm}
        />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-bold shadow-sm transition hover:scale-[1.02] ${
                  isActive ? filterStyles[filter] : "bg-white text-campus-ink"
                }`}
                key={filter}
                onClick={() => setActiveFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            );
          })}
        </div>
        <label className="flex min-h-11 w-fit items-center gap-3 rounded-full bg-white px-5 text-sm font-bold text-campus-ink shadow-sm">
          <input
            checked={includeSold}
            className="size-4 accent-campus-green"
            onChange={(event) => setIncludeSold(event.target.checked)}
            type="checkbox"
          />
          Include sold
        </label>
      </div>
      <p className="text-sm font-semibold text-campus-ink/60">
        {filteredListings.length} matching{" "}
        {filteredListings.length === 1 ? "listing" : "listings"}
      </p>
      {filteredListings.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-campus-ink/10 bg-white p-8 text-center shadow-soft">
          <p className="text-sm font-semibold text-campus-green">No listings found</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight">Nothing matches this search yet.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-campus-ink/60">
            Try a different keyword, switch categories, or include sold listings to widen the results.
          </p>
        </div>
      )}
    </>
  );
}
