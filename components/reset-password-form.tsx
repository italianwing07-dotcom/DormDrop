"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { getFriendlyAuthError, updatePassword } from "@/lib/supabase/auth";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type ResetState = "checking" | "ready" | "invalid" | "complete";

const LINK_FAILURE_FALLBACK =
  "Open the reset link from your email to set a new password. If you came here directly, request a link first.";

// Reads the error Supabase puts in the URL fragment (or query) on a failed
// recovery link, before client initialization clears it.
function readLinkFailure() {
  if (typeof window === "undefined") return LINK_FAILURE_FALLBACK;

  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const code = fragment.get("error_code") ?? query.get("error_code");
  const error = fragment.get("error") ?? query.get("error");

  if (code === "otp_expired") {
    return "This reset link has expired. Links last about an hour, so request a new one and open it right away.";
  }

  if (error || code) {
    return "This reset link is no longer valid. It may already have been used, including automatically by an email security scanner. Request a new one and open it promptly.";
  }

  return LINK_FAILURE_FALLBACK;
}

export function ResetPasswordForm() {
  const [state, setState] = useState<ResetState>("checking");
  const [reason, setReason] = useState<string>(LINK_FAILURE_FALLBACK);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    // Supabase reports why a link failed in the URL fragment, and initializing
    // the client clears it. Read it first so the student is told what actually
    // went wrong instead of one catch-all message.
    const failure = readLinkFailure();

    async function checkResetSession() {
      try {
        const supabase = getBrowserSupabaseClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_OUT" && isMounted) {
            setState((current) => current === "complete" ? current : "invalid");
          }
        });
        unsubscribe = () => subscription.unsubscribe();

        // Initialization consumes the email link before we check the user. A bad
        // link must not fall back to an unrelated, previously signed-in session.
        const { error: initializationError } = await supabase.auth.initialize();
        if (initializationError) throw initializationError;

        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user) throw userError ?? new Error("Auth session missing");
        if (isMounted) setState("ready");
      } catch {
        if (isMounted) {
          window.history.replaceState(window.history.state, "", window.location.pathname);
          setReason(failure);
          setState("invalid");
        }
      }
    }

    void checkResetSession();
    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state !== "ready" || isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmPassword") ?? "");
    setError(null);

    if (password.length < 8) {
      setError("Please use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match. Please re-enter them and try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      form.reset();
      setState("complete");
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (state === "checking") {
    return <p className="text-sm text-campus-muted" role="status">Checking your reset link...</p>;
  }

  if (state === "invalid") {
    return (
      <div className="space-y-4">
        <p className="rounded-ctl bg-campus-danger/10 p-4 text-sm leading-6 text-campus-ink" role="alert">
          {reason}
        </p>
        <Link className="flex min-h-12 items-center justify-center rounded-ctl bg-campus-brand px-6 text-sm font-semibold text-white hover:bg-campus-brandHover" href="/forgot-password">
          Request a new reset link
        </Link>
        <Link className="flex min-h-11 items-center justify-center text-sm font-bold text-campus-brand" href="/login">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (state === "complete") {
    return (
      <div className="space-y-4">
        <div className="space-y-2 rounded-ctl bg-campus-successBg p-4 text-sm leading-6 text-campus-success" role="status">
          <p className="font-bold">Password updated</p>
          <p>You’re signed in. Use your new password the next time you sign in to DormLoot.</p>
        </div>
        <Link className="flex min-h-12 items-center justify-center rounded-ctl bg-campus-brand px-6 text-sm font-semibold text-white hover:bg-campus-brandHover" href="/profile">
          Go to your profile
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="new-password">New password</label>
        <input
          autoComplete="new-password"
          className="min-h-12 w-full rounded-ctl border border-campus-border bg-campus-paper px-4 outline-none transition focus:border-campus-brand focus:bg-campus-card focus:shadow-focus"
          disabled={isSubmitting}
          id="new-password"
          minLength={8}
          name="password"
          required
          type={showPassword ? "text" : "password"}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold" htmlFor="confirm-new-password">Confirm new password</label>
        <input
          autoComplete="new-password"
          className="min-h-12 w-full rounded-ctl border border-campus-border bg-campus-paper px-4 outline-none transition focus:border-campus-brand focus:bg-campus-card focus:shadow-focus"
          disabled={isSubmitting}
          id="confirm-new-password"
          minLength={8}
          name="confirmPassword"
          required
          type={showPassword ? "text" : "password"}
        />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-campus-muted">
        <input className="size-4 accent-campus-brand" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} type="checkbox" />
        Show passwords
      </label>
      {error ? (
        <div className="space-y-2 rounded-ctl bg-campus-danger/10 p-4 text-sm leading-6 text-campus-ink" role="alert">
          <p>{error}</p>
          <Link className="font-bold text-campus-brand underline" href="/forgot-password">Request a new reset link</Link>
        </div>
      ) : null}
      <button
        className="min-h-12 w-full rounded-ctl bg-campus-brand px-6 text-sm font-semibold text-white transition hover:bg-campus-brandHover disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
