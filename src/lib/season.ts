import { supabase } from "./client";
import type { Season, SeasonInsert, SeasonUpdate } from "./types";

// ─── List ────────────────────────────────────────────────────

export async function getSeasons(): Promise<Season[]> {
  const { data, error } = await supabase
    .from("season")
    .select("*")
    .order("year", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

// ─── Get by ID ───────────────────────────────────────────────

export async function getSeason(id: string): Promise<Season> {
  const { data, error } = await supabase
    .from("season")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Get active (current date falls within start/end) ────────

export async function getActiveSeason(): Promise<Season | null> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("season")
    .select("*")
    .lte("start_date", today)
    .gte("end_date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data ?? null;
}

// ─── Create ──────────────────────────────────────────────────

export async function createSeason(season: SeasonInsert): Promise<Season> {
  const { data, error } = await supabase
    .from("season")
    .insert(season)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Update ──────────────────────────────────────────────────

export async function updateSeason(
  id: string,
  updates: SeasonUpdate,
): Promise<Season> {
  const { data, error } = await supabase
    .from("season")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Delete ──────────────────────────────────────────────────

export async function deleteSeason(id: string): Promise<void> {
  const { error } = await supabase.from("season").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
