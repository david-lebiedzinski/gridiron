import { supabase } from "./client";
import type { Team } from "./types";

// ─── List all teams ──────────────────────────────────────────

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("team")
    .select("*")
    .order("location")
    .order("name");

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
