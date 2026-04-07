import { supabase } from "./client";
import type { League, LeagueInsert, LeagueUpdate } from "./types";

// ─── List ────────────────────────────────────────────────────

export async function getLeagues(): Promise<League[]> {
  const { data, error } = await supabase
    .from("league")
    .select("*")
    .order("name");

  if (error) {
    throw error;
  }

  return data;
}

// ─── Get by ID ───────────────────────────────────────────────

export async function getLeague(id: string): Promise<League> {
  const { data, error } = await supabase
    .from("league")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Get by invite code ──────────────────────────────────────

export async function getLeagueByInviteCode(
  code: string,
): Promise<League | null> {
  const { data, error } = await supabase
    .from("league")
    .select("*")
    .eq("invite_code", code.toLowerCase())
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data ?? null;
}

// ─── Get leagues for a user ──────────────────────────────────

export async function getUserLeagues(userId: string): Promise<League[]> {
  const { data, error } = await supabase
    .from("league_member")
    .select("league:league_id(*)")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return data.map((row) => row.league as unknown as League);
}

// ─── Create ──────────────────────────────────────────────────

export async function createLeague(league: LeagueInsert): Promise<League> {
  const { data, error } = await supabase
    .from("league")
    .insert(league)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Update ──────────────────────────────────────────────────

export async function updateLeague(
  id: string,
  updates: LeagueUpdate,
): Promise<League> {
  const { data, error } = await supabase
    .from("league")
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

export async function deleteLeague(id: string): Promise<void> {
  const { error } = await supabase.from("league").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

// ─── Members ─────────────────────────────────────────────────

export async function getLeagueMembers(
  leagueId: string,
): Promise<{ league_id: string; user_id: string }[]> {
  const { data, error } = await supabase
    .from("league_member")
    .select("*")
    .eq("league_id", leagueId);

  if (error) {
    throw error;
  }

  return data;
}

export async function joinLeague(
  leagueId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("league_member")
    .insert({ league_id: leagueId, user_id: userId });

  if (error) {
    throw error;
  }
}

export async function leaveLeague(
  leagueId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("league_member")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

// ─── Regenerate invite code ─────────────────────────────────

export async function regenerateInviteCode(id: string): Promise<League> {
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  const { data, error } = await supabase
    .from("league")
    .update({ invite_code: code })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
