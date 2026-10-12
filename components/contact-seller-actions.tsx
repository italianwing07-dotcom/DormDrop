"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { Button, buttonClass } from "@/components/ui";

type ContactSellerActionsProps = {
  listingId: string;
  title: string;
};

// The seller's email is deliberately absent from the public page payload, so it
// is fetched here with the viewer's own session. A signed-out visitor never
// receives it, in the API response or in the server-rendered HTML.
export function ContactSellerActions({ listingId, title }: ContactSellerActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSellerContact() {
      try {
        const supabase = getBrowserSupabaseClient();
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) {
            setIsSignedIn(false);
            setIsLoading(false);
          }
          return;
        }

        const { data } = await supabase
          .from("listings")
          .select("seller_email")
          .eq("id", listingId)
          .maybeSingle();

        if (isMounted) {
          setIsSignedIn(true);
          setEmail(data?.seller_email ?? null);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsSignedIn(false);
          setIsLoading(false);
        }
      }
    }

    void loadSellerContact();

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  if (isLoading) {
    return (
      <p className="flex min-h-11 items-center text-sm text-campus-muted" role="status">
        Checking seller contact
      </p>
    );
  }

  if (!isSignedIn) {
    return (
      <Link className={buttonClass("secondary", "md", "w-full")} href="/login">
        Sign in to view seller contact
      </Link>
    );
  }

  if (!email) {
    return (
      <p className="text-sm text-campus-muted">
        This seller has no email on file. Use Message Seller instead.
      </p>
    );
  }

  async function copyEmail() {
    if (!email) {
      return;
    }

    await navigator.clipboard.writeText(email);
    setCopied(true);
  }

  return (
    <div className="space-y-2">
      <a
        className={buttonClass("secondary", "md", "w-full")}
        href={`mailto:${email}?subject=${encodeURIComponent(
          `Interested in your DormLoot listing: ${title}`
        )}&body=${encodeURIComponent(`Hi, I'm interested in your listing "${title}" on DormLoot.`)}`}
      >
        Email seller
      </a>
      <Button className="w-full" onClick={copyEmail} size="sm" type="button" variant="ghost">
        {copied ? "Copied" : "Copy email address"}
      </Button>
    </div>
  );
}
