import { supabase } from "./client";

// ─── Sign Up ─────────────────────────────────────────────────

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    password,
    email,
  });

  if (error) {
    throw error;
  }

  return data;
}

// ─── Sign In ─────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    password,
    email,
  });

  if (error) {
    throw error;
  }

  return data;
}

// ─── Sign Out ────────────────────────────────────────────────

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

// ─── Get Session ─────────────────────────────────────────────

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}
