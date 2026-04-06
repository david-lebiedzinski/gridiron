import { supabase } from "./client";
import type {
  Pick,
  PickInsert,
  PickUpdate,
  WeekBonus,
  WeekBonusInsert,
} from "./types";

// ─── Get picks for a league + game ──────────────────────────

export async function getPicksByGame(
  leagueId: string,
  gameId: string,
): Promise<Pick[]> {
  const { data, error } = await supabase
    .from("pick")
    .select("*")
    .eq("league_id", leagueId)
    .eq("game_id", gameId);

  if (error) {
    throw error;
  }

  return data;
}

// ─── Get picks for a league + season ─────────────────────────

export async function getPicksBySeason(
  leagueId: string,
  seasonId: string,
): Promise<Pick[]> {
  const { data, error } = await supabase
    .from("pick")
    .select("*, game!inner(season_id)")
    .eq("league_id", leagueId)
    .eq("game.season_id", seasonId);

  if (error) {
    throw error;
  }

  return data;
}

// ─── Get picks for a user in a league ────────────────────────

export async function getUserPicks(
  leagueId: string,
  userId: string,
): Promise<Pick[]> {
  const { data, error } = await supabase
    .from("pick")
    .select("*")
    .eq("league_id", leagueId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return data;
}

// ─── Upsert (create or change pick) ─────────────────────────

export async function upsertPick(pick: PickInsert): Promise<Pick> {
  const { data, error } = await supabase
    .from("pick")
    .upsert(pick, { onConflict: "league_id,user_id,game_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Delete pick ─────────────────────────────────────────────

export async function deletePick(
  leagueId: string,
  userId: string,
  gameId: string,
): Promise<void> {
  const { error } = await supabase
    .from("pick")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", userId)
    .eq("game_id", gameId);

  if (error) {
    throw error;
  }
}

// ─── Bulk update pick results (after game final) ─────────────

export async function updatePickResults(
  picks: { league_id: string; user_id: string; game_id: string } & PickUpdate,
): Promise<void> {
  const { league_id, user_id, game_id, ...updates } = picks;

  const { error } = await supabase
    .from("pick")
    .update(updates)
    .eq("league_id", league_id)
    .eq("user_id", user_id)
    .eq("game_id", game_id);

  if (error) {
    throw error;
  }
}

// ─── Week Bonuses ────────────────────────────────────────────

export async function getWeekBonuses(leagueId: string): Promise<WeekBonus[]> {
  const { data, error } = await supabase
    .from("week_bonus")
    .select("*")
    .eq("league_id", leagueId);

  if (error) {
    throw error;
  }

  return data;
}

export async function createWeekBonus(
  bonus: WeekBonusInsert,
): Promise<WeekBonus> {
  const { data, error } = await supabase
    .from("week_bonus")
    .insert(bonus)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
