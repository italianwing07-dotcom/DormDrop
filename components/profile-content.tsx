"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { ListingCardSkeleton } from "@/components/listing-card-skeleton";
import { getCampusFilterOptions, getCampusFilterValue } from "@/lib/campuses";
import { mapListingRow } from "@/lib/supabase/listings";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { ListingRow } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

type ProfileTab = "my" | "saved";
type SavedListingResult = {
  listings: ListingRow | null;
};

export function ProfileContent() {
  const [user, setUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<ListingRow[]>([]);
  const [savedListings, setSavedListings] = useState<ListingRow[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<ProfileTab>("my");
  const [activeCampusFilter, setActiveCampusFilter] = useState("All");
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [updatingSoldListingId, setUpdatingSoldListingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user: currentUser },
          error: userError
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        setUser(currentUser);

        if (!currentUser) {
          setUserListings([]);
          setSavedListings([]);
          setSavedCount(0);
          return;
        }

        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const { data: savedListingsData, error: savedListingsError } = await supabase
          .from("saved_listings")
          .select("listings(*)")
          .eq("user_id", currentUser.id)
          .order("created_at", { ascending: false });

        if (savedListingsError) {
          throw savedListingsError;
        }

        const mappedSavedListings = ((savedListingsData ?? []) as unknown as SavedListingResult[])
          .map((savedListing) => savedListing.listings)
          .filter((listing): listing is ListingRow => Boolean(listing));

        setUserListings(data ?? []);
        setSavedListings(mappedSavedListings);
        setSavedCount(mappedSavedListings.length);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load your profile."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleDeleteListing(listingId: string) {
    if (!user) {
      return;
    }

    setDeleteError(null);
    setDeletingListingId(listingId);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setUserListings((currentListings) =>
        currentListings.filter((listing) => listing.id !== listingId)
      );
      setSavedListings((currentListings) => {
        const nextListings = currentListings.filter(
          (listing) => listing.id !== listingId
        );
        setSavedCount(nextListings.length);
        return nextListings;
      });
    } catch (caughtError) {
      setDeleteError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete this listing."
      );
    } finally {
      setDeletingListingId(null);
    }
  }

  async function handleToggleSoldListing(listing: ListingRow) {
    if (!user) {
      return;
    }

    const nextSoldValue = !listing.sold;

    setDeleteError(null);
    setUpdatingSoldListingId(listing.id);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase
        .from("listings")
        .update({ sold: nextSoldValue })
        .eq("id", listing.id)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setUserListings((currentListings) =>
        currentListings.map((currentListing) =>
          currentListing.id === listing.id
            ? { ...currentListing, sold: nextSoldValue }
            : currentListing
        )
      );
    } catch (caughtError) {
      setDeleteError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update this listing."
      );
    } finally {
      setUpdatingSoldListingId(null);
    }
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-campus-ink/10 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-2xl bg-campus-mint" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-32 rounded-full bg-campus-mint" />
                <div className="h-7 w-48 rounded-full bg-campus-mint" />
                <div className="h-4 w-56 rounded-full bg-campus-mint" />
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="h-20 rounded-2xl bg-campus-paper" key={index} />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <ListingCardSkeleton />
            <ListingCardSkeleton />
          </div>
        </section>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-campus-ink/10 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-campus-coral">Not signed in</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">Log in to view your profile</h1>
          <p className="mt-3 text-sm leading-6 text-campus-ink/70">
            {error ?? "Your DormDrop profile appears after you sign in."}
          </p>
          <Link
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink"
            href="/login"
          >
            Go to login
          </Link>
        </section>
      </main>
    );
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "DD";
  const listingCount = userListings.length;
  const campusFilters = getCampusFilterOptions();
  const filteredUserListings =
    activeCampusFilter === "All"
      ? userListings
      : userListings.filter(
          (listing) => getCampusFilterValue(listing.campus) === activeCampusFilter
        );
  const wantedCount = userListings.filter(
    (listing) => listing.category === "Wanted"
  ).length;
  const hasUserListings = filteredUserListings.length > 0;
  const hasSavedListings = savedListings.length > 0;
  const showMyListingsEmptyState = !isLoading && filteredUserListings.length === 0;
  const showSavedListingsEmptyState = !isLoading && savedListings.length === 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-campus-ink/10 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-campus-mint text-xl font-bold text-campus-green">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-campus-green">Student profile</p>
              <h1 className="text-2xl font-bold tracking-tight">DormDrop Student</h1>
              <p className="truncate text-sm text-campus-ink/60">{user.email}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              [String(listingCount), "Posts"],
              [String(savedCount), "Saved"],
              [String(wantedCount), "Wanted"]
            ].map(([count, label]) => (
              <div key={label} className="rounded-2xl bg-campus-paper p-3">
                <p className="text-xl font-bold text-campus-ink">{count}</p>
                <p className="mt-1 text-xs font-medium text-campus-ink/60">{label}</p>
              </div>
            ))}
          </div>
          {savedCount === 0 || wantedCount === 0 ? (
            <div className="mt-4 space-y-2">
              {savedCount === 0 ? (
                <div className="rounded-2xl bg-campus-paper p-3">
                  <p className="text-sm font-bold tracking-tight">No saved listings yet</p>
                  <p className="mt-1 text-xs leading-5 text-campus-ink/60">
                    Save a listing from its details page to track it here.
                  </p>
                </div>
              ) : null}
              {wantedCount === 0 ? (
                <div className="rounded-2xl bg-campus-paper p-3">
                  <p className="text-sm font-bold tracking-tight">No wanted listings yet</p>
                  <p className="mt-1 text-xs leading-5 text-campus-ink/60">
                    Create a Wanted post when you are looking for a dorm item.
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-campus-green">Profile listings</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                {activeTab === "my" ? "My listings" : "Saved listings"}
              </h2>
            </div>
            <div className="grid grid-cols-2 rounded-full bg-campus-paper p-1">
              <button
                className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
                  activeTab === "my"
                    ? "bg-white text-campus-ink shadow-sm"
                    : "text-campus-ink/60 hover:text-campus-ink"
                }`}
                onClick={() => setActiveTab("my")}
                type="button"
              >
                My Listings
              </button>
              <button
                className={`min-h-10 rounded-full px-4 text-sm font-semibold transition ${
                  activeTab === "saved"
                    ? "bg-white text-campus-ink shadow-sm"
                    : "text-campus-ink/60 hover:text-campus-ink"
                }`}
                onClick={() => setActiveTab("saved")}
                type="button"
              >
                Saved Listings
              </button>
            </div>
          </div>
          {activeTab === "my" ? (
            <label className="block sm:w-56">
              <span className="sr-only">Filter profile listings by campus</span>
              <select
                className="min-h-11 w-full rounded-full border border-campus-ink/10 bg-white px-5 text-sm font-bold text-campus-ink shadow-sm outline-none transition focus:border-campus-green focus:ring-4 focus:ring-campus-green/10"
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
          ) : null}
          {activeTab === "my" && deleteError ? (
            <div className="rounded-2xl bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
              {deleteError}
            </div>
          ) : null}
          {activeTab === "my" && hasUserListings ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredUserListings.map((sourceListing) => {
                const listing = mapListingRow(sourceListing);
                const isDeleting = deletingListingId === listing.id;
                const isUpdatingSold = updatingSoldListingId === listing.id;
                const soldButtonLabel = listing.sold
                  ? "Mark as Available"
                  : "Mark as Sold";

                return (
                  <div className="space-y-3" key={listing.id}>
                    <ListingCard listing={listing} />
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        className="flex min-h-11 items-center justify-center rounded-full bg-campus-paper px-5 text-sm font-semibold text-campus-ink transition hover:bg-campus-mint"
                        href={`/listings/${listing.id}/edit`}
                      >
                        Edit
                      </Link>
                      <button
                        className="min-h-11 rounded-full border border-campus-coral/30 bg-white px-5 text-sm font-semibold text-campus-coral transition hover:bg-campus-coral hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isDeleting}
                        onClick={() => handleDeleteListing(listing.id)}
                        type="button"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        className="col-span-2 min-h-11 rounded-full bg-campus-ink px-5 text-sm font-semibold text-white transition hover:bg-campus-green disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isUpdatingSold}
                        onClick={() => handleToggleSoldListing(sourceListing)}
                        type="button"
                      >
                        {isUpdatingSold ? "Updating..." : soldButtonLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {activeTab === "saved" && hasSavedListings ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {savedListings.map((sourceListing) => {
                const listing = mapListingRow(sourceListing);

                return <ListingCard key={listing.id} listing={listing} />;
              })}
            </div>
          ) : null}
          {activeTab === "my" && showMyListingsEmptyState ? (
            <div className="rounded-3xl border border-campus-ink/10 bg-white p-8 text-center shadow-soft">
              <p className="text-sm font-semibold text-campus-green">No listings yet</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight">{activeCampusFilter === "All"
                ? "Your posts will appear here."
                : `No ${activeCampusFilter} posts yet.`}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-campus-ink/60">
                {activeCampusFilter === "All"
                  ? "Create your first listing and it will appear here."
                  : "Switch campuses or create a new listing for this campus."}
              </p>
              <Link
                className="mt-5 inline-flex min-h-12 items-center rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink"
                href="/create"
              >
                Create listing
              </Link>
            </div>
          ) : null}
          {activeTab === "saved" && showSavedListingsEmptyState ? (
            <div className="rounded-3xl border border-campus-ink/10 bg-white p-8 text-center shadow-soft">
              <p className="text-sm font-semibold text-campus-green">No saved listings yet</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight">Saved listings will appear here.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-campus-ink/60">
                Save a listing from its details page when you want to come back to it later.
              </p>
              <Link
                className="mt-5 inline-flex min-h-12 items-center rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink"
                href="/browse"
              >
                Browse listings
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
