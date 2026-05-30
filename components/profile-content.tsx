"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListingCard } from "@/components/listing-card";
import { ListingCardSkeleton } from "@/components/listing-card-skeleton";
import { mapListingRow } from "@/lib/supabase/listings";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { ListingRow } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

export function ProfileContent() {
  const [user, setUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<ListingRow[]>([]);
  const [savedCount, setSavedCount] = useState(0);
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

        const { count: savedListingsCount, error: savedListingsError } = await supabase
          .from("saved_listings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id);

        if (savedListingsError) {
          throw savedListingsError;
        }

        setUserListings(data ?? []);
        setSavedCount(savedListingsCount ?? 0);
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
  const wantedCount = userListings.filter(
    (listing) => listing.category === "Wanted"
  ).length;
  const hasUserListings = listingCount > 0;
  const showEmptyState = !isLoading && listingCount === 0;

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
          <div>
            <p className="text-sm font-semibold text-campus-green">My listings</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Current posts</h2>
          </div>
          {deleteError ? (
            <div className="rounded-2xl bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
              {deleteError}
            </div>
          ) : null}
          {hasUserListings ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {userListings.map((sourceListing) => {
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
          {showEmptyState ? (
            <div className="rounded-3xl border border-campus-ink/10 bg-white p-8 text-center shadow-soft">
              <p className="text-sm font-semibold text-campus-green">No listings yet</p>
              <h3 className="mt-2 text-xl font-bold tracking-tight">Your posts will appear here.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-campus-ink/60">
                Create your first listing and it will appear here.
              </p>
              <Link
                className="mt-5 inline-flex min-h-12 items-center rounded-full bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-ink"
                href="/create"
              >
                Create listing
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
