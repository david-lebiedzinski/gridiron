import { supabase } from "./supabase";
import { syncWeekGames } from "./espn";

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

  if (error) {
    throw error;
  }
  return data;
}

// ─── Start Next Season (single cascade entry point) ──────────

export async function startNextSeason(year: number) {
  // 1. Deactivate all current NFL seasons
  await supabase
    .from("nfl_seasons")
    .update({ is_active: false })
    .eq("is_active", true);

  // 2. Deactivate all current league_seasons
  await supabase
    .from("league_seasons")
    .update({ is_active: false })
    .eq("is_active", true);

  // 3. Create or reuse the NFL season for this year
  const { data: existing } = await supabase
    .from("nfl_seasons")
    .select("id")
    .eq("year", year)
    .single();

  let nflSeasonId: string;

  if (existing) {
    nflSeasonId = existing.id;
    await supabase
      .from("nfl_seasons")
      .update({ is_active: true })
      .eq("id", nflSeasonId);
  } else {
    const { data: created, error } = await supabase
      .from("nfl_seasons")
      .insert({ year, is_active: true })
      .select("id")
      .single();

    if (error) {
      throw error;
    }
    nflSeasonId = created.id;
  }

  // 4. Auto-create league_seasons for all leagues
  const { data: leagues } = await supabase
    .from("leagues")
    .select("id");

  if (leagues) {
    for (const league of leagues) {
      // Find previous league_season to copy settings from
      const { data: prevSeason } = await supabase
        .from("league_seasons")
        .select("id")
        .eq("league_id", league.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Create new league_season (unlocked so commissioners can tweak)
      const { data: leagueSeason, error: lsError } = await supabase
        .from("league_seasons")
        .insert({
          league_id: league.id,
          nfl_season_id: nflSeasonId,
          name: `${year} Season`,
          is_active: true,
          locked: false,
        })
        .select("id")
        .single();

      if (lsError) {
        throw lsError;
      }

      // Copy settings from previous season or use defaults
      if (prevSeason) {
        const { data: prevSettings } = await supabase
          .from("season_settings")
          .select("*")
          .eq("league_season_id", prevSeason.id)
          .single();

        if (prevSettings) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { league_season_id, locked, ...settings } = prevSettings;
          await supabase.from("season_settings").insert({
            ...settings,
            league_season_id: leagueSeason.id,
            locked: false,
          });
        } else {
          await supabase
            .from("season_settings")
            .insert({ league_season_id: leagueSeason.id, locked: false });
        }
      } else {
        await supabase
          .from("season_settings")
          .insert({ league_season_id: leagueSeason.id, locked: false });
      }
    }
  }

  // 5. Auto-sync ESPN schedule for all regular season weeks
  for (let week = 1; week <= 18; week++) {
    try {
      await syncNFLWeek(nflSeasonId, week, "regular", year);
    } catch {
      // ESPN may not have all weeks yet — continue with available data
    }
  }

  // Sync playoff weeks
  const playoffWeeks: {
    week: number;
    type: "wildcard" | "divisional" | "championship" | "superbowl";
  }[] = [
    { week: 19, type: "wildcard" },
    { week: 20, type: "divisional" },
    { week: 21, type: "championship" },
    { week: 22, type: "superbowl" },
  ];

  for (const pw of playoffWeeks) {
    try {
      await syncNFLWeek(nflSeasonId, pw.week, pw.type, year);
    } catch {
      // Playoff data may not exist yet
    }
  }

  return nflSeasonId;
}

// ─── Calculate Next Season Year ───────────────────────────────

export function calculateNextSeasonYear(
  seasons: { year: number }[],
): number {
  if (seasons.length > 0) {
    const maxYear = Math.max(...seasons.map((s) => s.year));
    return maxYear + 1;
  }
  // No seasons exist — use NFL year logic (June-to-June)
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  if (month < 5) {
    // Before June → current year - 1
    return now.getFullYear() - 1;
  }
  return now.getFullYear();
}

// ─── Sync NFL Week (internal) ─────────────────────────────────

async function syncNFLWeek(
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
  const { data: week, error: weekError } = await supabase
    .from("nfl_weeks")
    .upsert(
      { season_id: seasonId, week_number: weekNumber, week_type: weekType },
      { onConflict: "season_id,week_number" },
    )
    .select()
    .single();

  if (weekError) {
    throw weekError;
  }

  const espnSeasonType = weekType === "regular" ? "regular" : "post";
  await syncWeekGames(week.id, year, weekNumber, espnSeasonType);

  return week;
}
