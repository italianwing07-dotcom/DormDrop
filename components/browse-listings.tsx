"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { ListingCard } from "@/components/listing-card";
import { Button, Card, EmptyState, cx, inputClass, selectClass } from "@/components/ui";
import { getCampusFilterOptions, getCampusFilterValue } from "@/lib/campuses";
import type { Listing } from "@/lib/listings";

type CategoryFilter = "All" | Listing["type"];

const filters: CategoryFilter[] = ["All", "Free", "For Sale", "Wanted"];

export function BrowseListings({
  listings,
  initialSearchTerm = "",
  initialCategory = "All"
}: {
  listings: Listing[];
  initialSearchTerm?: string;
  initialCategory?: CategoryFilter;
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>(initialCategory);
  const [activeCampusFilter, setActiveCampusFilter] = useState("All");
  const [includeSold, setIncludeSold] = useState(false);

  const campusFilters = useMemo(() => getCampusFilterOptions(), []);

  const filteredListings = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesSold = includeSold || !listing.sold;
      const matchesCategory = activeFilter === "All" || listing.type === activeFilter;
      const matchesCampus =
        activeCampusFilter === "All" ||
        getCampusFilterValue(listing.campus) === activeCampusFilter;
      const searchableText = (listing.title + " " + listing.description).toLowerCase();
      const matchesSearch = !normalizedSearchTerm || searchableText.includes(normalizedSearchTerm);

      return matchesSold && matchesCategory && matchesCampus && matchesSearch;
    });
  }, [activeCampusFilter, activeFilter, includeSold, listings, searchTerm]);

  const hasFilters =
    searchTerm.trim().length > 0 || activeFilter !== "All" || activeCampusFilter !== "All" || includeSold;

  function clearFilters() {
    setSearchTerm("");
    setActiveFilter("All");
    setActiveCampusFilter("All");
    setIncludeSold(false);
  }

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_auto_auto]">
          <div className="relative flex items-center">
            <MagnifyingGlass aria-hidden className="pointer-events-none absolute left-3 text-campus-subtle" size={18} />
            <input
              aria-label="Search listings"
              className={cx(inputClass, "pl-10")}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search for fridges, chairs, books"
              type="search"
              value={searchTerm}
            />
          </div>

          <select
            aria-label="Filter by campus"
            className={cx(selectClass, "lg:w-48")}
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

          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-ctl border border-campus-border bg-campus-surface px-4 text-sm font-medium text-campus-ink">
            <input
              checked={includeSold}
              className="size-4 accent-campus-brand"
              onChange={(event) => setIncludeSold(event.target.checked)}
              type="checkbox"
            />
            Include sold
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            {filters.map((filter) => {
              const isActive = activeFilter === filter;

              return (
                <button
                  aria-pressed={isActive}
                  className={cx(
                    "min-h-9 rounded-full px-3.5 text-sm font-medium transition",
                    isActive
                      ? "bg-campus-brand text-white"
                      : "border border-campus-border bg-campus-card text-campus-muted hover:border-campus-borderStrong hover:text-campus-ink"
                  )}
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  type="button"
                >
                  {filter}
                </button>
              );
            })}
          </div>

          <p aria-live="polite" className="ml-auto text-sm text-campus-muted">
            {filteredListings.length} {filteredListings.length === 1 ? "item" : "items"}
          </p>

          {hasFilters ? (
            <Button onClick={clearFilters} size="sm" variant="ghost">
              <X size={15} />
              Clear
            </Button>
          ) : null}
        </div>
      </Card>

      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          body="Once students start posting, items show up here. Be the first to list something from your room."
          title="No listings yet"
        />
      ) : (
        <EmptyState
          action={
            <Button onClick={clearFilters} variant="secondary">
              Clear filters
            </Button>
          }
          body="Nothing matches these filters. Try a different keyword, another campus, or include sold items."
          title="No matching items"
        />
      )}
    </div>
  );
}
