"use client";
import { createClient } from "@supabase/supabase-js";

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase is not configured. Use demo mode or add public credentials.");
  return createClient(url, anonKey);
}

export async function requestMagicLink(email: string) {
  const supabase = createBrowserSupabaseClient();
  return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/account` } });
}
