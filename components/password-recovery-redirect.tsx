"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

export function PasswordRecoveryRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const supabase = getBrowserSupabaseClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // Supabase can fall back to the configured Site URL. Route recovery
        // sessions to the password form regardless of where the email lands.
        if (event === "PASSWORD_RECOVERY" && session && window.location.pathname !== "/reset-password") {
          router.replace("/reset-password");
        }
      });
      return () => subscription.unsubscribe();
    } catch {
      // Account pages display connection/configuration errors themselves.
    }
  }, [router]);

  return null;
}
