import { supabase } from "./supabase";
import type { SeasonSettingsUpdate } from "../types";

// ─── Create League ────────────────────────────────────────────

export async function createLeague(name: string, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", userId)
    .single();

  if (!profile?.is_super_admin) {
    throw new Error("Unauthorized");
  }

  const { data: league, error } = await supabase
    .from("leagues")
    .insert({ name, commissioner_id: userId })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Auto-join as commissioner
  await supabase.from("league_members").insert({
    league_id: league.id,
    role: "commissioner",
    user_id: userId,
  });

  return league;
}

// ─── Regenerate Invite Code ───────────────────────────────────

export async function regenerateInviteCode(leagueId: string) {
  const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();

  const { data, error } = await supabase
    .from("leagues")
    .update({ invite_code: newCode })
    .eq("id", leagueId)
    .select("invite_code")
    .single();

  if (error) throw error;
  return data.invite_code;
}

// ─── Remove Member ────────────────────────────────────────────

export async function removeMember(
  leagueId: string,
  userId: string,
  commissionerId: string,
) {
  if (userId === commissionerId) {
    throw new Error("Commissioner can't remove themselves");
  }

  const { error } = await supabase
    .from("league_members")
    .delete()
    .eq("league_id", leagueId)
    .eq("user_id", userId);

  if (error) throw error;
}

// ─── Transfer Commissioner ────────────────────────────────────

export async function transferCommissioner(
  leagueId: string,
  newCommissionerId: string,
  currentCommissionerId: string,
) {
  await supabase
    .from("leagues")
    .update({ commissioner_id: newCommissionerId })
    .eq("id", leagueId);

  await supabase
    .from("league_members")
    .update({ role: "member" })
    .eq("league_id", leagueId)
    .eq("user_id", currentCommissionerId);

  await supabase
    .from("league_members")
    .update({ role: "commissioner" })
    .eq("league_id", leagueId)
    .eq("user_id", newCommissionerId);
}

// ─── Start League Season ──────────────────────────────────────

export async function startLeagueSeason(
  leagueId: string,
  nflSeasonId: string,
  name: string,
  copyFromLeagueSeasonId?: string,
) {
  const { data: existing } = await supabase
    .from("league_seasons")
    .select("id")
    .eq("league_id", leagueId)
    .eq("is_active", true)
    .single();

  if (existing) throw new Error("League already has an active season");

  const { data: leagueSeason, error } = await supabase
    .from("league_seasons")
    .insert({
      league_id: leagueId,
      nfl_season_id: nflSeasonId,
      name,
      is_active: true,
      locked: true, // lock settings immediately on start
    })
    .select()
    .single();

  if (error) throw error;

  // Copy or default settings
  if (copyFromLeagueSeasonId) {
    const { data: prev } = await supabase
      .from("season_settings")
      .select("*")
      .eq("league_season_id", copyFromLeagueSeasonId)
      .single();

    if (prev) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { league_season_id, ...settings } = prev;
      await supabase.from("season_settings").insert({
        ...settings,
        league_season_id: leagueSeason.id,
        locked: true,
      });
    }
  } else {
    await supabase
      .from("season_settings")
      .insert({ league_season_id: leagueSeason.id, locked: true });
  }

  return leagueSeason;
}

// ─── Update Season Settings (before season starts) ───────────

export async function updateSeasonSettings(
  leagueSeasonId: string,
  settings: SeasonSettingsUpdate,
) {
  // Check not locked
  const { data: current } = await supabase
    .from("season_settings")
    .select("locked")
    .eq("league_season_id", leagueSeasonId)
    .single();

  if (current?.locked) throw new Error("Season settings are locked");

  const { error } = await supabase
    .from("season_settings")
    .update(settings)
    .eq("league_season_id", leagueSeasonId);

  if (error) throw error;
}

// ─── Archive League Season ────────────────────────────────────

export async function archiveLeagueSeason(leagueSeasonId: string) {
  const { error } = await supabase
    .from("league_seasons")
    .update({ is_active: false })
    .eq("id", leagueSeasonId);

  if (error) throw error;
}
