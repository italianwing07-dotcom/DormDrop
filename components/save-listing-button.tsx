"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "@phosphor-icons/react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { buttonClass } from "@/components/ui";

type SaveListingButtonProps = {
  listingId: string;
  listingTitle?: string;
  variant?: "full" | "icon";
};

function announceSavedListingChange(listingId: string, isSaved: boolean) {
  window.dispatchEvent(
    new CustomEvent("dormloot:saved-listings-changed", {
      detail: { listingId, isSaved }
    })
  );
}

export function SaveListingButton({ listingId, listingTitle, variant = "full" }: SaveListingButtonProps) {
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
          data: { session }
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;

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
      } catch {
        if (isMounted) {
          setError("Could not load saved status.");
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
      setError("Sign in with your school email to save listings.");
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
        announceSavedListingChange(listingId, false);
      } else {
        const { error: insertError } = await supabase
          .from("saved_listings")
          .upsert({ user_id: userId, listing_id: listingId }, { onConflict: "user_id,listing_id" });

        if (insertError) {
          throw insertError;
        }

        setIsSaved(true);
        announceSavedListingChange(listingId, true);
      }
    } catch {
      setError("Could not update saved listing. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const label = listingTitle
    ? `${isSaved ? "Remove" : "Save"} ${listingTitle} ${isSaved ? "from" : "to"} your saved listings`
    : isSaved
      ? "Remove from saved listings"
      : "Save listing";

  if (variant === "icon") {
    return (
      // z-10 keeps this above the card's full-surface link overlay.
      <button
        aria-label={label}
        aria-pressed={isSaved}
        className={
          "relative z-10 flex size-10 items-center justify-center rounded-full border border-campus-border bg-campus-card/95 shadow-sm backdrop-blur transition hover:bg-campus-card disabled:cursor-not-allowed disabled:opacity-60 " +
          (isSaved ? "text-campus-danger" : "text-campus-muted hover:text-campus-ink")
        }
        disabled={isLoading || isSaving}
        onClick={handleToggleSaved}
        type="button"
      >
        <Heart size={19} weight={isSaved ? "fill" : "regular"} />
        {error ? <span className="sr-only">{error}</span> : null}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        aria-label={label}
        aria-pressed={isSaved}
        className={buttonClass("secondary", "lg", "w-full")}
        disabled={isLoading || isSaving}
        onClick={handleToggleSaved}
        type="button"
      >
        <Heart size={18} weight={isSaved ? "fill" : "regular"} />
        {isSaving ? "Saving" : isSaved ? "Saved" : "Save"}
      </button>
      {error ? <p className="text-sm leading-relaxed text-campus-danger">{error}</p> : null}
    </div>
  );
}
