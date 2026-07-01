"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { signInWithEmail, signUpWithEmail } from "@/lib/supabase/auth";

type AuthMode = "login" | "signup";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
        router.push("/profile");
        router.refresh();
        return;
      }

      const session = await signUpWithEmail(email, password);

      if (session) {
        router.push("/profile");
        router.refresh();
        return;
      }

      setMessage("Check your email to confirm your account, then sign in.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 rounded-[14px] bg-campus-paper p-1">
        <button
          className={`min-h-11 rounded-[14px] text-sm font-bold transition ${
            mode === "login" ? "bg-campus-card text-campus-ink shadow-sm" : "text-campus-muted"
          }`}
          onClick={() => setMode("login")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={`min-h-11 rounded-[14px] text-sm font-bold transition ${
            mode === "signup" ? "bg-campus-card text-campus-ink shadow-sm" : "text-campus-muted"
          }`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Create account
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Email</span>
          <input
            className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-paper px-4 outline-none transition placeholder:text-campus-muted focus:border-campus-green focus:bg-campus-card focus:ring-4 focus:ring-campus-green/10"
            name="email"
            placeholder="student@university.edu"
            required
            type="email"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold">Password</span>
          <input
            className="min-h-12 w-full rounded-[14px] border border-campus-border bg-campus-paper px-4 outline-none transition placeholder:text-campus-muted focus:border-campus-green focus:bg-campus-card focus:ring-4 focus:ring-campus-green/10"
            minLength={6}
            name="password"
            placeholder="Password"
            required
            type="password"
          />
        </label>

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
