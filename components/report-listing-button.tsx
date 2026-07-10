"use client";

import { useState } from "react";
import { getCurrentUser } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

const reasons = [
  "Prohibited item",
  "Spam or scam",
  "Harassment",
  "Incorrect information",
  "Other"
] as const;

export function ReportListingButton({ listingId }: { listingId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<(typeof reasons)[number]>(reasons[0]);
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitReport() {
    if (!supabase) {
      setMessage("Reporting is temporarily unavailable.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        setMessage("Sign in with your school email to report this listing.");
        return;
      }

      const { error } = await supabase.from("reports").insert({
        listing_id: listingId,
        reporter_id: user.id,
        reason,
        details: details.trim() || null
      });

      if (error) {
        if (error.code === "23505") {
          setMessage("You already reported this listing.");
          return;
        }
        throw error;
      }

      setMessage("Report submitted. Thank you for helping keep DormDrop safe.");
      setDetails("");
    } catch {
      setMessage("We couldn't submit that report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4 border-t border-campus-border pt-4">
      <button
        className="text-sm font-semibold text-campus-muted underline decoration-campus-border underline-offset-4"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        Report this listing
      </button>
      {isOpen ? (
        <div className="mt-3 space-y-3 rounded-[14px] bg-campus-paper p-4">
          <label className="block text-sm font-semibold">
            Reason
            <select
              className="mt-2 min-h-11 w-full rounded-[14px] border border-campus-border bg-white px-3"
              onChange={(event) => setReason(event.target.value as (typeof reasons)[number])}
              value={reason}
            >
              {reasons.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Additional details (optional)
            <textarea
              className="mt-2 min-h-24 w-full rounded-[14px] border border-campus-border bg-white p-3"
              maxLength={1000}
              onChange={(event) => setDetails(event.target.value)}
              value={details}
            />
          </label>
          <button
            className="min-h-11 rounded-[14px] bg-campus-ink px-5 text-sm font-bold text-white disabled:opacity-60"
            disabled={isSubmitting}
            onClick={submitReport}
            type="button"
          >
            {isSubmitting ? "Submitting..." : "Submit report"}
          </button>
          {message ? <p className="text-sm leading-6 text-campus-muted" role="status">{message}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
