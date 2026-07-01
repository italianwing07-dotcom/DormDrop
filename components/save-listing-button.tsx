"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type SaveListingButtonProps = {
  listingId: string;
  variant?: "full" | "icon";
};

export function SaveListingButton({ listingId, variant = "full" }: SaveListingButtonProps) {
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

  if (variant === "icon") {
    return (
      <div className="space-y-1">
        <button
          aria-label={isSaved ? "Unsave listing" : "Save listing"}
          className={
            "flex size-11 items-center justify-center rounded-[14px] border border-white/70 bg-campus-card/95 text-lg font-black shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70 " +
            (isSaved ? "text-campus-coral" : "text-campus-ink")
          }
          disabled={isLoading || isSaving}
          onClick={handleToggleSaved}
          type="button"
        >
          {isSaved ? "♥" : "♡"}
        </button>
        {error ? <p className="sr-only">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <button
        className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-paper px-6 text-sm font-bold text-campus-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
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
