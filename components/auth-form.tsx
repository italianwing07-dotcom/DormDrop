"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  getFriendlyAuthError,
  resendSignupVerificationEmail,
  signInWithEmail,
  signUpWithEmail
} from "@/lib/supabase/auth";

type AuthMode = "login" | "signup";

function getEmailRedirectTo() {
  return window.location.origin + "/profile";
}

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function handleModeChange(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setPendingVerificationEmail(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        router.push("/profile");
        router.refresh();
        return;
      }

      if (!email.endsWith(".edu")) {
        setError("Please use your school .edu email to create a DormDrop account.");
        return;
      }

      if (password.length < 8) {
        setError("Please use a password with at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match. Please re-enter them and try again.");
        return;
      }

      if (!acceptedTerms) {
        setError("Please agree to the Terms and Privacy Policy before creating your account.");
        return;
      }

      await signUpWithEmail(email, password, getEmailRedirectTo());
      setPendingVerificationEmail(email);
      setMessage("Verification email sent.");
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerificationEmail() {
    if (!pendingVerificationEmail) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsResending(true);

    try {
      await resendSignupVerificationEmail(pendingVerificationEmail, getEmailRedirectTo());
      setMessage("We sent another verification email. It may take a minute to arrive.");
    } catch (caughtError) {
      setError(getFriendlyAuthError(caughtError));
    } finally {
      setIsResending(false);
    }
  }

  if (pendingVerificationEmail) {
    return (
      <div className="space-y-5 rounded-[20px] border border-campus-border bg-campus-paper p-5 text-center sm:p-6">
        <div className="mx-auto flex size-14 items-center justify-center rounded-[18px] bg-campus-card text-2xl font-black text-campus-green shadow-sm">
          @
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-campus-green">Check your school email</p>
          <h2 className="text-2xl font-black tracking-tight text-campus-ink">
            Verify your DormDrop account
          </h2>
          <p className="text-sm leading-6 text-campus-muted">
            We sent a verification link to <span className="font-bold text-campus-ink">{pendingVerificationEmail}</span>. Open it to finish creating your account and return to your profile.
          </p>
        </div>

        {message ? (
          <div className="rounded-[14px] bg-campus-successBg p-4 text-sm font-medium leading-6 text-campus-success">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[14px] bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
            {error}
          </div>
        ) : null}

        <div className="space-y-3">
          <button
            className="min-h-12 w-full rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isResending}
            onClick={handleResendVerificationEmail}
            type="button"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </button>
          <button
            className="min-h-11 w-full rounded-[14px] border border-campus-border bg-campus-card px-6 text-sm font-semibold text-campus-ink transition hover:bg-slate-50"
            onClick={() => handleModeChange("login")}
            type="button"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 rounded-[14px] bg-campus-paper p-1">
        <button
          className={`min-h-11 rounded-[14px] text-sm font-bold transition ${
            mode === "login" ? "bg-campus-card text-campus-ink shadow-sm" : "text-campus-muted"
          }`}
          onClick={() => handleModeChange("login")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={`min-h-11 rounded-[14px] text-sm font-bold transition ${
            mode === "signup" ? "bg-campus-card text-campus-ink shadow-sm" : "text-campus-muted"
          }`}
          onClick={() => handleModeChange("signup")}
          type="button"
        >
          Create account
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="space-y-2">
          <span className="text-sm font-semibold">School email</span>
          <input
            autoComplete="email"
            className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-paper px-4 outline-none transition placeholder:text-campus-muted focus:border-campus-green focus:bg-campus-card focus:ring-4 focus:ring-campus-green/10"
            name="email"
            placeholder="student@university.edu"
            required
            type="email"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Password</span>
          <div className="flex rounded-[14px] border border-campus-border bg-campus-paper transition focus-within:border-campus-green focus-within:bg-campus-card focus-within:ring-4 focus-within:ring-campus-green/10">
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="min-h-12 min-w-0 flex-1 bg-transparent px-4 outline-none placeholder:text-campus-muted"
              minLength={mode === "signup" ? 8 : undefined}
              name="password"
              placeholder={mode === "signup" ? "At least 8 characters" : "Password"}
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              className="px-4 text-sm font-bold text-campus-green"
              onClick={() => setShowPassword((currentValue) => !currentValue)}
              type="button"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {mode === "signup" ? (
          <>
            <label className="space-y-2">
              <span className="text-sm font-semibold">Confirm password</span>
              <div className="flex rounded-[14px] border border-campus-border bg-campus-paper transition focus-within:border-campus-green focus-within:bg-campus-card focus-within:ring-4 focus-within:ring-campus-green/10">
                <input
                  autoComplete="new-password"
                  className="min-h-12 min-w-0 flex-1 bg-transparent px-4 outline-none placeholder:text-campus-muted"
                  minLength={8}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                />
                <button
                  className="px-4 text-sm font-bold text-campus-green"
                  onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
                  type="button"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-[14px] border border-campus-border bg-campus-paper p-4 text-sm leading-6 text-campus-muted">
              <input
                checked={acceptedTerms}
                className="mt-1 size-4 accent-campus-green"
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                required
                type="checkbox"
              />
              <span>
                I agree to the DormDrop <Link className="font-bold text-campus-green" href="/terms">Terms</Link> and <Link className="font-bold text-campus-green" href="/privacy">Privacy Policy</Link>.
              </span>
            </label>
          </>
        ) : null}

        {error ? (
          <div className="rounded-[14px] bg-campus-coral/10 p-4 text-sm font-medium leading-6 text-campus-ink">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-[14px] bg-campus-successBg p-4 text-sm font-medium leading-6 text-campus-success">
            {message}
          </div>
        ) : null}

        <button
          className="min-h-12 w-full rounded-[14px] bg-campus-green px-6 text-sm font-semibold text-white transition hover:bg-campus-hover disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? "Please wait..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </>
  );
}
