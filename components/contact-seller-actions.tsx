"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type ContactSellerActionsProps = {
  email?: string | null;
  title: string;
};

export function ContactSellerActions({ email, title }: ContactSellerActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = getBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setIsSignedIn(Boolean(data.session?.user));
        setIsCheckingSession(false);
      }
    }).catch(() => {
      if (isMounted) {
        setIsSignedIn(false);
        setIsCheckingSession(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isCheckingSession) {
    return (
      <p className="mt-5 flex min-h-12 w-full items-center justify-center rounded-[14px] bg-campus-paper px-6 text-sm font-semibold text-campus-muted">
        Checking seller contact...
      </p>
    );
  }

  if (!isSignedIn) {
    return (
      <Link
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-[14px] bg-campus-paper px-6 text-sm font-bold text-campus-ink transition hover:bg-slate-50"
        href="/login"
      >
        Sign in to view seller contact info
      </Link>
    );
  }

  if (!email) {
    return (
      <p className="mt-5 flex min-h-12 w-full items-center justify-center rounded-[14px] bg-campus-paper px-6 text-sm font-semibold text-campus-muted">
        Seller email not available.
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
    <div className="mt-5 space-y-3">
      <a
        className="flex min-h-12 w-full items-center justify-center rounded-[14px] bg-campus-green px-6 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-campus-hover hover:shadow-md"
        href={`mailto:${email}?subject=${encodeURIComponent(
          `Interested in your DormDrop listing: ${title}`
        )}&body=${encodeURIComponent(
          `Hi, I'm interested in your listing "${title}" on DormDrop.`
        )}`}
      >
        Contact seller
      </a>
      <button
        className="min-h-11 w-full rounded-[14px] border border-campus-border bg-campus-paper px-5 text-sm font-bold text-campus-ink transition hover:bg-slate-50"
        onClick={copyEmail}
        type="button"
      >
        {copied ? "Copied!" : "Copy email"}
      </button>
    </div>
  );
}
