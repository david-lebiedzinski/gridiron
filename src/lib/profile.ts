import { supabase } from "./client";
import type { Profile, ProfileInsert, ProfileUpdate } from "./types";

// ─── Get by ID ───────────────────────────────────────────────

export async function getProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data ?? null;
}

// ─── List all ────────────────────────────────────────────────

export async function getProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}

// ─── Create ──────────────────────────────────────────────────

export async function createProfile(profile: ProfileInsert): Promise<Profile> {
  const { data, error } = await supabase
    .from("profile")
    .insert(profile)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Update ──────────────────────────────────────────────────

export async function updateProfile(
  id: string,
  updates: ProfileUpdate,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profile")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
