"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { ListingRow, ReportRow } from "@/lib/supabase/types";

type ReportWithListing = { report: ReportRow; listing?: ListingRow; removed: boolean };
type Action = "dismiss" | "remove" | "restore";
const buttonClass = "min-h-11 rounded-[14px] border border-campus-border px-4 text-sm font-semibold disabled:opacity-50";

export function ModerationDashboard() {
  const [access, setAccess] = useState<"loading" | "login" | "denied" | "allowed">("loading");
  const [filter, setFilter] = useState<ReportRow["status"]>("open");
  const [reports, setReports] = useState<ReportWithListing[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const saving = useRef(false);

  useEffect(() => {
    let active = true;
    const client = getBrowserSupabaseClient();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await client.auth.getSession();
        if (!active) return;
        if (!session) { setAccess("login"); setReports([]); return; }
        const permission = await client.rpc("is_moderator");
        if (permission.error) throw permission.error;
        if (!active) return;
        if (!permission.data) { setAccess("denied"); setReports([]); return; }
        setAccess("allowed");
        const result = await client.from("reports").select("*", { count: "exact" })
          .eq("status", filter).order("created_at", { ascending: false }).range(page * 25, page * 25 + 24);
        if (result.error) throw result.error;
        const ids = [...new Set((result.data ?? []).map((report) => report.listing_id))];
        const [listingResult, hiddenResult] = ids.length ? await Promise.all([
          client.from("listings").select("*").in("id", ids),
          client.from("hidden_listings").select("listing_id").in("listing_id", ids)
        ]) : [{ data: [], error: null }, { data: [], error: null }];
        if (listingResult.error) throw listingResult.error;
        if (hiddenResult.error) throw hiddenResult.error;
        if (!active) return;
        const listings = new Map((listingResult.data ?? []).map((listing) => [listing.id, listing]));
        const hidden = new Set((hiddenResult.data ?? []).map((row) => row.listing_id));
        setReports((result.data ?? []).map((report) => ({ report, listing: listings.get(report.listing_id), removed: hidden.has(report.listing_id) })));
        setCount(result.count ?? 0);
        if (page > 0 && !result.data?.length) setPage((current) => current - 1);
      } catch {
        if (active) setError("We couldn't load reports. Please refresh and try again.");
      } finally { if (active) setLoading(false); }
    }
    void load();
    const { data: { subscription } } = client.auth.onAuthStateChange((event) => {
      if ((event === "SIGNED_OUT" || event === "SIGNED_IN") && active) {
        active = false;
        setAccess(event === "SIGNED_OUT" ? "login" : "loading");
        setReports([]);
        setRefresh((value) => value + 1);
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [filter, page, refresh]);

  async function review(id: string, action: Action) {
    if (saving.current) return;
    saving.current = true;
    setPending(id);
    setError(null);
    setNotice(null);
    try {
      const { error } = await getBrowserSupabaseClient().rpc("review_report", { report_id: id, action });
      if (error) throw error;
      setConfirmRemove(null);
      setNotice(action === "remove" ? "Listing removed from the marketplace." : action === "restore" ? "Listing restored to the marketplace." : "Report marked as reviewed.");
      setRefresh((value) => value + 1);
    } catch {
      setError("We couldn't confirm this action. Refresh reports to check the current status before trying again.");
    } finally { saving.current = false; setPending(null); }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <Link className="text-sm font-semibold text-campus-green" href="/profile">Back to profile</Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Reported listings</h1>
      {error ? <p role="alert" className="mt-4 rounded-[14px] bg-campus-coral/10 p-4 text-sm">{error}</p> : null}
      {access === "loading" ? <p className="mt-5">{loading ? "Checking access…" : "Unable to check access."}</p> : null}
      {access === "login" ? <p className="mt-5">Sign in with your admin account to review reports. <Link className="font-semibold text-campus-green underline" href="/login">Sign in</Link></p> : null}
      {access === "denied" ? <p className="mt-5">This page is available to DormDrop admins only.</p> : null}
      {(access === "allowed" || error) ? <button className={`${buttonClass} mt-4`} disabled={loading || Boolean(pending)} onClick={() => setRefresh((value) => value + 1)}>Refresh reports</button> : null}
      {access === "allowed" ? <>
        <p className="mt-3 text-sm text-campus-muted">Review the listing and report details, then keep or remove the listing. Removed listings can be restored.</p>
        <div className="my-5 flex flex-wrap gap-2" aria-label="Report status">
          {(["open", "reviewed", "resolved"] as const).map((status) => <button key={status} aria-pressed={filter === status}
            disabled={Boolean(pending)} className={`${buttonClass} ${filter === status ? "bg-campus-green text-white" : "bg-white"}`}
            onClick={() => { setFilter(status); setPage(0); setConfirmRemove(null); }}>{status === "open" ? "Needs review" : status === "reviewed" ? "Reviewed" : "Resolved"}</button>)}
        </div>
        {notice ? <p role="status" className="mb-4 text-sm font-semibold text-campus-green">{notice}</p> : null}
        {loading ? <p role="status">Loading reports…</p> : reports.length === 0 ? <p className="rounded-[20px] border border-campus-border p-6">No reports in this view.</p> : <div className="space-y-5">
          {reports.map(({ report, listing, removed }) => <article className="space-y-4 rounded-[20px] border border-campus-border bg-campus-card p-5 shadow-soft" key={report.id}>
            <div className="flex items-start gap-4">
              {listing?.image_url ? <Image className="size-20 rounded-[14px] object-cover" width={160} height={160} src={listing.image_url} alt={listing.title} /> : null}
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-bold">{listing?.title ?? "Listing unavailable"}</h2>
                <p className="text-sm text-campus-muted">{listing ? `${listing.campus} · ${listing.category} · ${listing.price}` : "The listing may have been deleted."}</p>
                {removed ? <p className="mt-1 text-sm font-bold text-campus-coral">Removed from marketplace</p> : listing ? <Link className="text-sm font-semibold text-campus-green underline" href={`/listings/${listing.id}`}>View listing</Link> : null}
              </div>
            </div>
            {listing ? <p className="whitespace-pre-wrap break-words text-sm text-campus-muted">{listing.description}</p> : null}
            <div className="rounded-[14px] bg-campus-paper p-4">
              <p className="font-semibold">{report.reason}</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm">{report.details || "No additional details."}</p>
              <p className="mt-2 text-xs text-campus-muted">Reported {new Date(report.created_at).toLocaleString()}</p>
              {report.reviewed_at ? <p className="mt-1 text-xs text-campus-muted">Last reviewed {new Date(report.reviewed_at).toLocaleString()}</p> : null}
            </div>
            {confirmRemove === report.id ? <div className="space-y-3 rounded-[14px] bg-campus-coral/10 p-4">
              <p className="text-sm">Remove this listing from the marketplace? You can restore it from Resolved reports.</p>
              <div className="flex flex-wrap gap-2">
                <button className={`${buttonClass} bg-campus-coral text-white`} disabled={Boolean(pending)} onClick={() => review(report.id, "remove")}>{pending === report.id ? "Removing…" : "Confirm removal"}</button>
                <button className={buttonClass} disabled={Boolean(pending)} onClick={() => setConfirmRemove(null)}>Cancel</button>
              </div>
            </div> : <div className="flex flex-wrap gap-2">
              {report.status === "open" ? <button className={buttonClass} disabled={Boolean(pending)} onClick={() => review(report.id, "dismiss")}>Keep listing · Mark reviewed</button> : null}
              {listing ? <button className={`${buttonClass} ${removed ? "text-campus-green" : "text-campus-coral"}`} disabled={Boolean(pending)}
                onClick={() => removed ? review(report.id, "restore") : setConfirmRemove(report.id)}>{removed ? "Restore listing" : "Remove listing"}</button> : null}
            </div>}
          </article>)}
        </div>}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button className={buttonClass} disabled={page === 0 || loading || Boolean(pending)} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <p className="text-sm">Page {page + 1} · {count} reports</p>
          <button className={buttonClass} disabled={(page + 1) * 25 >= count || loading || Boolean(pending)} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      </> : null}
    </main>
  );
}
