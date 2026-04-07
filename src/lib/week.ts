import { supabase } from "./client";
import type { Week } from "./types";

// ─── List by season ──────────────────────────────────────────

export async function getWeeks(seasonId: string): Promise<Week[]> {
  const { data, error } = await supabase
    .from("week")
    .select("*")
    .eq("season_id", seasonId)
    .order("phase")
    .order("espn_value");

  if (error) {
    throw error;
  }

  return data;
}

// ─── Get by ID ───────────────────────────────────────────────

export async function getWeek(id: string): Promise<Week> {
  const { data, error } = await supabase
    .from("week")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Get current week (today falls within start/end) ─────────

export async function getCurrentWeek(seasonId: string): Promise<Week | null> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("week")
    .select("*")
    .eq("season_id", seasonId)
    .lte("start_date", today)
    .gte("end_date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data ?? null;
}
