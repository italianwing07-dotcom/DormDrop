import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

declare global {
  var dormDropSupabase:
    | ReturnType<typeof createClient<Database>>
    | undefined;
}

export function getBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  if (typeof window === "undefined") {
    throw new Error("The browser Supabase client can only be used in the browser.");
  }

  if (!globalThis.dormDropSupabase) {
    globalThis.dormDropSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    });
  }

  return globalThis.dormDropSupabase;
}
