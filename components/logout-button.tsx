"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/supabase/auth";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { buttonClass } from "@/components/ui";

export function LogoutButton() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);
    await signOut();
    setEmail(null);
    router.push("/login");
    router.refresh();
  }

  if (!email) {
    return (
      <Link className={buttonClass("primary", "sm", "shrink-0")} href="/login">
        Log in
      </Link>
    );
  }

  return (
    <button
      aria-label={`Log out of ${email}`}
      className={buttonClass("secondary", "sm", "shrink-0")}
      disabled={isLoggingOut}
      onClick={handleLogout}
      type="button"
    >
      {isLoggingOut ? "Logging out" : "Log out"}
    </button>
  );
}
