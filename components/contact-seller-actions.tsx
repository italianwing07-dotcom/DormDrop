"use client";

import { useState } from "react";

type ContactSellerActionsProps = {
  email?: string | null;
  title: string;
};

export function ContactSellerActions({ email, title }: ContactSellerActionsProps) {
  const [copied, setCopied] = useState(false);

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
