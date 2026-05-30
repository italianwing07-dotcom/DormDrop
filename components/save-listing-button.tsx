"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type SaveListingButtonProps = {
  listingId: string;
};

export function SaveListingButton({ listingId }: SaveListingButtonProps) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSavedState() {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!isMounted) {
          return;
        }

        setUserId(user?.id ?? null);

        if (!user) {
          setIsSaved(false);
          return;
        }

        const { data, error: savedError } = await supabase
          .from("saved_listings")
          .select("listing_id")
          .eq("user_id", user.id)
          .eq("listing_id", listingId)
          .maybeSingle();

        if (savedError) {
          throw savedError;
        }

        if (isMounted) {
          setIsSaved(Boolean(data));
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load saved status."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSavedState();

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  async function handleToggleSaved() {
    setError(null);

    if (!userId) {
      router.push("/login");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = getBrowserSupabaseClient();

      if (isSaved) {
        const { error: deleteError } = await supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", userId)
          .eq("listing_id", listingId);

        if (deleteError) {
          throw deleteError;
        }

        setIsSaved(false);
      } else {
        const { error: insertError } = await supabase
          .from("saved_listings")
          .insert({ user_id: userId, listing_id: listingId });

        if (insertError) {
          throw insertError;
        }

        setIsSaved(true);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update saved listing."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        className="min-h-12 w-full rounded-full bg-campus-paper px-6 text-sm font-semibold text-campus-ink transition hover:bg-campus-mint disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading || isSaving}
        onClick={handleToggleSaved}
        type="button"
      >
        {isSaving ? "Saving..." : isSaved ? "Unsave" : "Save"}
      </button>
      {error ? (
        <p className="text-sm font-medium leading-6 text-campus-coral">
          {error}
        </p>
      ) : null}
    </div>
  );
}
