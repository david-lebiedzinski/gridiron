import { supabase } from "./client";
import type {
  Team,
  TeamInsert,
  TeamUpdate,
  TeamRecord,
  TeamRecordInsert,
} from "./types";

// ─── List all teams ──────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("team")
    .select("*")
    .order("conference")
    .order("division")
    .order("city");

  if (error) {
    throw error;
  }

  return data;
}

// ─── Get by ID ───────────────────────────────────────────────

export async function getTeam(id: string): Promise<Team> {
  const { data, error } = await supabase
    .from("team")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Get by abbreviation ─────────────────────────────────────

export async function getTeamByAbbr(abbr: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from("team")
    .select("*")
    .eq("abbr", abbr)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data ?? null;
}

// ─── Create ──────────────────────────────────────────────────

export async function createTeam(team: TeamInsert): Promise<Team> {
  const { data, error } = await supabase
    .from("team")
    .insert(team)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ─── Update ──────────────────────────────────────────────────

export async function updateTeam(
  id: string,
  updates: TeamUpdate,
): Promise<Team> {
  const { data, error } = await supabase
    .from("team")
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

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from("team").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

// ─── Records ─────────────────────────────────────────────────

export async function getTeamRecords(seasonId: string): Promise<TeamRecord[]> {
  const { data, error } = await supabase
    .from("team_record")
    .select("*")
    .eq("season_id", seasonId);

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertTeamRecord(
  record: TeamRecordInsert,
): Promise<TeamRecord> {
  const { data, error } = await supabase
    .from("team_record")
    .upsert(record, { onConflict: "team_id,season_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
