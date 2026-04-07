import { supabase } from "./client";
import type { Game, GameUpdate } from "./types";

// ─── List by week ────────────────────────────────────────────

export async function getGamesByWeek(weekId: string): Promise<Game[]> {
  const { data, error } = await supabase
    .from("game")
    .select("*")
    .eq("week_id", weekId)
    .order("kickoff_time");

  if (error) {
    throw error;
  }

  return data;
}

// ─── List by season (joined via week) ────────────────────────

export async function getGamesBySeason(seasonId: string): Promise<Game[]> {
  const { data, error } = await supabase
    .from("game")
    .select("*, week!inner(season_id)")
    .eq("week.season_id", seasonId)
    .order("kickoff_time");

  if (error) {
    throw error;
  }

  return data as unknown as Game[];
}

// ─── Get by ID ───────────────────────────────────────────────

export async function getGame(id: string): Promise<Game> {
  const { data, error } = await supabase
    .from("game")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Update (admin game editor) ──────────────────────────────

export async function updateGame(
  id: string,
  updates: GameUpdate,
): Promise<Game> {
  const { data, error } = await supabase
    .from("game")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
