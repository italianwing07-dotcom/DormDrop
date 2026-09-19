"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getFriendlyAuthError, requestPasswordReset } from "@/lib/supabase/auth";

export function ForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setError(null);
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email, `${window.location.origin}/reset-password`);
      setIsSent(true);
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {isSent ? (
        <div className="space-y-2 rounded-[14px] bg-campus-successBg p-4 text-sm leading-6 text-campus-success" role="status">
          <p className="font-bold">Check your email</p>
          <p>If an account exists for that email, you’ll receive a password reset link. Check your spam folder too.</p>
          <p>The email may take a few minutes to arrive.</p>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="reset-email">Email address</label>
            <input
              autoComplete="email"
              autoCapitalize="none"
              className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-paper px-4 outline-none transition placeholder:text-campus-muted focus:border-campus-green focus:bg-campus-card focus:ring-4 focus:ring-campus-green/10"
              disabled={isSubmitting}
              id="reset-email"
              name="email"
              placeholder="student@fordham.edu"
              required
              type="email"
            />
          </div>
          {error ? (
            <p className="rounded-[14px] bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="min-h-12 w-full rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
      {isSent ? (
        <button
          className="flex min-h-11 w-full items-center justify-center text-sm font-bold text-campus-green"
          onClick={() => setIsSent(false)}
          type="button"
        >
          Try another email
        </button>
      ) : null}
      <Link className="flex min-h-11 items-center justify-center text-sm font-bold text-campus-green underline-offset-4 hover:underline" href="/login">
        Back to sign in
      </Link>
    </div>
  );
}
