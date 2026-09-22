"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { getFriendlyAuthError, updatePassword } from "@/lib/supabase/auth";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

type ResetState = "checking" | "ready" | "invalid" | "complete";

export function ResetPasswordForm() {
  const [state, setState] = useState<ResetState>("checking");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

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
        <p className="rounded-[14px] bg-campus-coral/10 p-4 text-sm leading-6 text-campus-ink" role="alert">
          This reset link is invalid or has expired. Request a new link and open the most recent email.
        </p>
        <Link className="flex min-h-12 items-center justify-center rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white hover:bg-campus-hover" href="/forgot-password">
          Request a new reset link
        </Link>
        <Link className="flex min-h-11 items-center justify-center text-sm font-bold text-campus-green" href="/login">
          Back to sign in
        </Link>
      </div>
    );
  }

  if (state === "complete") {
    return (
      <div className="space-y-4">
        <div className="space-y-2 rounded-[14px] bg-campus-successBg p-4 text-sm leading-6 text-campus-success" role="status">
          <p className="font-bold">Password updated</p>
          <p>You’re signed in. Use your new password the next time you sign in to DormLoot.</p>
        </div>
        <Link className="flex min-h-12 items-center justify-center rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white hover:bg-campus-hover" href="/profile">
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
          className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-paper px-4 outline-none transition focus:border-campus-green focus:bg-campus-card focus:ring-4 focus:ring-campus-green/10"
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
          className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-paper px-4 outline-none transition focus:border-campus-green focus:bg-campus-card focus:ring-4 focus:ring-campus-green/10"
          disabled={isSubmitting}
          id="confirm-new-password"
          minLength={8}
          name="confirmPassword"
          required
          type={showPassword ? "text" : "password"}
        />
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-campus-muted">
        <input className="size-4 accent-campus-green" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} type="checkbox" />
        Show passwords
      </label>
      {error ? (
        <div className="space-y-2 rounded-[14px] bg-campus-coral/10 p-4 text-sm leading-6 text-campus-ink" role="alert">
          <p>{error}</p>
          <Link className="font-bold text-campus-green underline" href="/forgot-password">Request a new reset link</Link>
        </div>
      ) : null}
      <button
        className="min-h-12 w-full rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
