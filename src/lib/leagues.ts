import { supabase } from "./supabase";
import type { LeagueMembership, JoinLeagueResult } from "../types";

// ─── Join League ─────────────────────────────────────────────

export async function joinLeagueByCode(
  inviteCode: string,
): Promise<JoinLeagueResult> {
  const { data, error } = await supabase.rpc("join_league_by_code", {
    code: inviteCode,
  });
  if (error) throw new Error(error.message);
  return data as unknown as JoinLeagueResult;
}

// ─── Get User Leagues ────────────────────────────────────────

export async function getUserLeagues(
  userId: string,
): Promise<LeagueMembership[]> {
  const { data, error } = await supabase
    .from("league_members")
    .select(
      `
      role,
      stats_visibility,
      joined_at,
      leagues (
        id,
        name,
        invite_code,
        commissioner_id,
        league_seasons (
          id,
          name,
          is_active,
          locked,
          nfl_seasons ( year )
        )
      )
    `,
    )
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as LeagueMembership[];
}

// ─── Get League Members ───────────────────────────────────────

interface LeagueMemberRow {
  role: string;
  stats_visibility: string;
  joined_at: string;
  profiles: { id: string; username: string; avatar_color: string } | null;
}

export async function getLeagueMembers(
  leagueId: string,
): Promise<LeagueMemberRow[]> {
  const { data, error } = await supabase
    .from("league_members")
    .select(
      `
      role,
      stats_visibility,
      joined_at,
      profiles (
        id,
        username,
        avatar_color
      )
    `,
    )
    .eq("league_id", leagueId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LeagueMemberRow[];
}

// ─── Update Stats Visibility ──────────────────────────────────

export async function updateStatsVisibility(
  leagueId: string,
  userId: string,
  visibility: "league_default" | "public" | "private",
): Promise<void> {
  const { error } = await supabase
    .from("league_members")
    .update({ stats_visibility: visibility })
    .eq("league_id", leagueId)
    .eq("user_id", userId);

  if (error) throw error;
}

// ─── Can View Stats ───────────────────────────────────────────

export async function canViewStats(
  viewerId: string,
  targetUserId: string,
  leagueId: string,
): Promise<boolean> {
  if (viewerId === targetUserId) return true;

  const { data } = await supabase
    .from("league_members")
    .select(
      `
      stats_visibility,
      leagues (
        league_seasons (
          season_settings ( stats_public_default )
        )
      )
    `,
    )
    .eq("user_id", targetUserId)
    .eq("league_id", leagueId)
    .single();

  if (!data) return false;

  const preference = data.stats_visibility;
  type LeaguesShape = {
    league_seasons: {
      season_settings: { stats_public_default: boolean };
    }[];
  } | null;
  const leagues = data.leagues as LeaguesShape;
  const leagueDefault =
    leagues?.league_seasons?.[0]?.season_settings?.stats_public_default ?? true;

  if (preference === "public") return true;
  if (preference === "private") return false;
  return leagueDefault;
}
