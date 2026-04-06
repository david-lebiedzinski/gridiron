import { supabase } from "./client";
import type { Week, WeekInsert, WeekUpdate } from "./types";

// ─── List by season ──────────────────────────────────────────

export async function getWeeks(seasonId: string): Promise<Week[]> {
  const { data, error } = await supabase
    .from("week")
    .select("*")
    .eq("season_id", seasonId)
    .order("type")
    .order("number");

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

// ─── Create ──────────────────────────────────────────────────

export async function createWeek(week: WeekInsert): Promise<Week> {
  const { data, error } = await supabase
    .from("week")
    .insert(week)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Update ──────────────────────────────────────────────────

export async function updateWeek(
  id: string,
  updates: WeekUpdate,
): Promise<Week> {
  const { data, error } = await supabase
    .from("week")
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

export async function deleteWeek(id: string): Promise<void> {
  const { error } = await supabase.from("week").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
