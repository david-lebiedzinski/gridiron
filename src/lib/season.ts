import { supabase } from "./client";
import type { Season } from "./types";

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

// ─── Get current (season with max year) ──────────────────────

export async function getCurrentSeason(): Promise<Season | null> {
  const { data, error } = await supabase
    .from("season")
    .select("*")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}
