import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

function getSupabaseClient() {
  return getBrowserSupabaseClient();
}

function requireEduEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.edu$/.test(normalizedEmail)) {
    throw new Error("edu-email-required");
  }

  return normalizedEmail;
}

function requireStrongPassword(password: string) {
  if (password.length < 8) {
    throw new Error("weak-password");
  }
}

export function getFriendlyAuthError(caughtError: unknown) {
  const message =
    caughtError instanceof Error ? caughtError.message.toLowerCase() : String(caughtError).toLowerCase();

  if (message.includes("edu-email-required")) {
    return "Please use your school .edu email to create a DormDrop account.";
  }

  if (message.includes("weak-password") || message.includes("password should be")) {
    return "Please use a password with at least 8 characters.";
  }

  if (
    message.includes("invalid login") ||
    message.includes("invalid credentials") ||
    message.includes("email not confirmed")
  ) {
    return message.includes("email not confirmed")
      ? "Please verify your school email before signing in."
      : "That email and password do not match. Please try again.";
  }

  if (message.includes("rate") || message.includes("too many") || message.includes("over_email_send_rate_limit")) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("missing supabase")
  ) {
    return "We could not connect to DormDrop right now. Please check your connection and try again.";
  }

  if (message.includes("already registered") || message.includes("user already")) {
    return "An account may already exist for this email. Try signing in instead.";
  }

  return "Something went wrong. Please try again.";
}

export async function signInWithEmail(email: string, password: string) {
  const client = getSupabaseClient();

  const { error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signUpWithEmail(email: string, password: string, emailRedirectTo: string) {
  const client = getSupabaseClient();
  const schoolEmail = requireEduEmail(email);
  requireStrongPassword(password);

  const { data, error } = await client.auth.signUp({
    email: schoolEmail,
    password,
    options: {
      emailRedirectTo
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.session;
}

export async function resendSignupVerificationEmail(email: string, emailRedirectTo: string) {
  const client = getSupabaseClient();
  const schoolEmail = requireEduEmail(email);

  const { error } = await client.auth.resend({
    type: "signup",
    email: schoolEmail,
    options: {
      emailRedirectTo
    }
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signOut() {
  const client = getSupabaseClient();

  const { error } = await client.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser() {
  const client = getSupabaseClient();

  const { data, error } = await client.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}
