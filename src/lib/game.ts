import { supabase } from "./client";
import type { Game, GameInsert, GameUpdate } from "./types";

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

// ─── List by season ──────────────────────────────────────────

export async function getGamesBySeason(seasonId: string): Promise<Game[]> {
  const { data, error } = await supabase
    .from("game")
    .select("*")
    .eq("season_id", seasonId)
    .order("kickoff_time");

  if (error) {
    throw error;
  }

  return data;
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

// ─── Create ──────────────────────────────────────────────────

export async function createGame(game: GameInsert): Promise<Game> {
  const { data, error } = await supabase
    .from("game")
    .insert(game)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Update ──────────────────────────────────────────────────

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

// ─── Bulk update (e.g. ESPN sync) ────────────────────────────

export async function upsertGames(games: GameInsert[]): Promise<Game[]> {
  const { data, error } = await supabase
    .from("game")
    .upsert(games, { onConflict: "espn_game_id" })
    .select();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Delete ──────────────────────────────────────────────────

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase.from("game").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
