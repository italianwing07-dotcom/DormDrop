"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
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
      <Link
        className="flex min-h-10 shrink-0 items-center rounded-[14px] bg-campus-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-campus-hover"
        href="/login"
      >
        Login
      </Link>
    );
  }

  return (
    <button
      className="min-h-10 shrink-0 rounded-[14px] bg-campus-green px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-campus-hover disabled:opacity-70"
      disabled={isLoggingOut}
      onClick={handleLogout}
      type="button"
    >
      {isLoggingOut ? "Logging out" : "Logout"}
    </button>
  );
}
