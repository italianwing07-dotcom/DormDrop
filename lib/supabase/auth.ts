import { supabase } from "@/lib/supabase/client";

function requireEduEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.edu$/.test(normalizedEmail)) {
    throw new Error("DormDrop accounts require a valid .edu school email address.");
  }

  return normalizedEmail;
}

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error("Missing Supabase environment variables.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) {
    throw new Error("Missing Supabase environment variables.");
  }

  const schoolEmail = requireEduEmail(email);
  const { data, error } = await supabase.auth.signUp({
    email: schoolEmail,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export async function signOut() {
  if (!supabase) {
    throw new Error("Missing Supabase environment variables.");
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  if (!supabase) {
    throw new Error("Missing Supabase environment variables.");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}
