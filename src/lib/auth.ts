import { supabase } from "./supabase";
import type { Profile, ProfileUpdate } from "../types";

// ─── Sign Up ─────────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  username: string,
) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (existing) {
    throw new Error("Username already taken");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
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
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

// ─── Get Profile ─────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

// ─── Update Profile ───────────────────────────────────────────

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate,
): Promise<Profile> {
  if (updates.username) {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", updates.username)
      .neq("id", userId)
      .single();

    if (existing) {
      throw new Error("Username already taken");
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}
