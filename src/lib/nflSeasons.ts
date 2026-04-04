import { supabase } from "./supabase";
import { syncWeekGames } from "./espn";

// ─── Create NFL Season ────────────────────────────────────────

export async function createNFLSeason(year: number) {
  const { data, error } = await supabase
    .from("nfl_seasons")
    .insert({ year, is_active: false })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Activate NFL Season ──────────────────────────────────────

export async function activateNFLSeason(seasonId: string) {
  // Deactivate all other seasons first
  await supabase
    .from("nfl_seasons")
    .update({ is_active: false })
    .eq("is_active", true);

  const { error } = await supabase
    .from("nfl_seasons")
    .update({ is_active: true })
    .eq("id", seasonId);

  if (error) throw error;
}

// ─── Close NFL Season ─────────────────────────────────────────

export async function closeNFLSeason(seasonId: string) {
  const { error } = await supabase
    .from("nfl_seasons")
    .update({ is_active: false })
    .eq("id", seasonId);

  if (error) throw error;
}

// ─── Get All NFL Seasons ──────────────────────────────────────

export async function getNFLSeasons() {
  const { data, error } = await supabase
    .from("nfl_seasons")
    .select(
      `
      *,
      nfl_weeks (
        id,
        week_number,
        week_type
      )
    `,
    )
    .order("year", { ascending: false });

  if (error) throw error;
  return data;
}

// ─── Sync NFL Week ────────────────────────────────────────────
// Pulls games from ESPN and upserts into the global games table

export async function syncNFLWeek(
  seasonId: string,
  weekNumber: number,
  weekType:
    | "regular"
    | "wildcard"
    | "divisional"
    | "championship"
    | "superbowl",
  year: number,
) {
  // Upsert the week
  const { data: week, error: weekError } = await supabase
    .from("nfl_weeks")
    .upsert(
      { season_id: seasonId, week_number: weekNumber, week_type: weekType },
      { onConflict: "season_id,week_number" },
    )
    .select()
    .single();

  if (weekError) throw weekError;

  // Pull from ESPN
  const espnSeasonType = weekType === "regular" ? "regular" : "post";
  await syncWeekGames(week.id, year, weekNumber, espnSeasonType);

  return week;
}
