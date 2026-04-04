import { supabase } from "./supabase";
import { isUpset } from "./espn";
import { updateStreaks } from "./analytics";
import type { WeekType, SeasonSettings, LeaderboardEntry } from "../types";

// Re-export for consumers
export type { WeekType, SeasonSettings, LeaderboardEntry };

// ─── Round Multiplier ─────────────────────────────────────────

export function getRoundMultiplier(
  weekType: WeekType,
  settings: SeasonSettings,
): number {
  switch (weekType) {
    case "regular":
      return 1;
    case "wildcard":
      return settings.wildcard_multiplier;
    case "divisional":
      return settings.divisional_multiplier;
    case "championship":
      return settings.championship_multiplier;
    case "superbowl":
      return settings.superbowl_multiplier;
  }
}

// ─── Single Pick Points ───────────────────────────────────────

export function calculatePickPoints(
  isCorrect: boolean,
  isUpsetPick: boolean,
  isSoleCorrect: boolean,
  weekType: WeekType,
  settings: SeasonSettings,
): number {
  if (!isCorrect) {
    return 0;
  }

  const multiplier = getRoundMultiplier(weekType, settings);
  const base = isUpsetPick
    ? settings.base_correct_pts * settings.upset_multiplier
    : settings.base_correct_pts;
  const bonus = isSoleCorrect ? settings.sole_correct_bonus * multiplier : 0;

  return base * multiplier + bonus;
}

// ─── Weekly Bonus ─────────────────────────────────────────────

export function calculateWeeklyBonus(
  weekType: WeekType,
  settings: SeasonSettings,
): number {
  const base = settings.weekly_bonus_regular;

  if (!settings.weekly_bonus_scales) {
    return base;
  }

  return base * getRoundMultiplier(weekType, settings);
}

export function distributeWeeklyBonus(
  weeklyTotals: Record<string, number>,
  weekType: WeekType,
  settings: SeasonSettings,
): Record<string, number> {
  if (Object.keys(weeklyTotals).length === 0) {
    return {};
  }

  const bonus = calculateWeeklyBonus(weekType, settings);
  const maxPoints = Math.max(...Object.values(weeklyTotals));
  const winners = Object.entries(weeklyTotals)
    .filter(([, pts]) => pts === maxPoints)
    .map(([userId]) => userId);

  const share = Math.round((bonus / winners.length) * 100) / 100;
  return Object.fromEntries(winners.map((userId) => [userId, share]));
}

// ─── Resolve Game Picks ───────────────────────────────────────

interface GameWithWeek {
  spread: string | null;
  weeks: { week_type: string } | null;
}

interface PickRow {
  id: string;
  user_id: string;
  league_season_id: string;
  picked_team_abbr: string;
}

export async function resolveGamePicks(
  gameId: string,
  winnerAbbr: string,
): Promise<void> {
  const { data: game } = await supabase
    .from("games")
    .select("spread, weeks(week_type)")
    .eq("id", gameId)
    .single();

  if (!game) {
    throw new Error("Game not found");
  }

  const gameData = game as unknown as GameWithWeek;
  const upset = isUpset(gameData.spread, winnerAbbr);
  const weekType = (gameData.weeks?.week_type ?? "regular") as WeekType;

  const { data: picks } = await supabase
    .from("picks")
    .select("id, user_id, league_season_id, picked_team_abbr")
    .eq("game_id", gameId);

  if (!picks?.length) {
    return;
  }

  const byLeagueSeason: Record<string, PickRow[]> = {};
  for (const pick of picks as PickRow[]) {
    if (!byLeagueSeason[pick.league_season_id]) {
      byLeagueSeason[pick.league_season_id] = [];
    }
    byLeagueSeason[pick.league_season_id].push(pick);
  }

  for (const [leagueSeasonId, leaguePicks] of Object.entries(byLeagueSeason)) {
    const correctPicks = leaguePicks.filter(
      (p) => p.picked_team_abbr === winnerAbbr,
    );
    const isSoleCorrect = correctPicks.length === 1;

    const { data: settings } = await supabase
      .from("season_settings")
      .select("*")
      .eq("league_season_id", leagueSeasonId)
      .single();

    if (!settings) {
      continue;
    }

    for (const pick of leaguePicks) {
      const correct = pick.picked_team_abbr === winnerAbbr;
      const points = calculatePickPoints(
        correct,
        upset,
        correct && isSoleCorrect,
        weekType,
        settings as SeasonSettings,
      );

      await supabase
        .from("picks")
        .update({
          is_correct: correct,
          is_upset: correct && upset,
          is_sole_correct: correct && isSoleCorrect,
          points_awarded: points,
        })
        .eq("id", pick.id);

      await updateStreaks(pick.user_id, leagueSeasonId, correct);
    }
  }
}

// ─── Leaderboard ──────────────────────────────────────────────

interface PickWithJoins {
  user_id: string;
  points_awarded: number | null;
  is_correct: boolean;
  is_upset: boolean;
  is_sole_correct: boolean;
  games: { weeks: { week_number: number; week_type: string } } | null;
  profiles: { username: string; avatar_color: string } | null;
}

export async function calculateLeaderboard(
  _leagueId: string,
  leagueSeasonId: string,
  settings: SeasonSettings,
): Promise<LeaderboardEntry[]> {
  const { data: picks } = await supabase
    .from("picks")
    .select(
      `
      user_id,
      points_awarded,
      is_correct,
      is_upset,
      is_sole_correct,
      games (
        weeks ( week_number, week_type )
      ),
      profiles ( username, avatar_color )
    `,
    )
    .eq("league_season_id", leagueSeasonId)
    .not("points_awarded", "is", null);

  if (!picks?.length) return [];

  const typedPicks = picks as unknown as PickWithJoins[];

  const byUser: Record<string, PickWithJoins[]> = {};
  for (const pick of typedPicks) {
    if (!byUser[pick.user_id]) byUser[pick.user_id] = [];
    byUser[pick.user_id].push(pick);
  }

  const byWeek: Record<number, Record<string, number>> = {};
  for (const pick of typedPicks) {
    const weekNum = pick.games?.weeks?.week_number ?? 0;
    if (!byWeek[weekNum]) byWeek[weekNum] = {};
    if (!byWeek[weekNum][pick.user_id]) byWeek[weekNum][pick.user_id] = 0;
    byWeek[weekNum][pick.user_id] += pick.points_awarded ?? 0;
  }

  const weeklyBonuses: Record<string, number> = {};
  for (const [weekNum, userTotals] of Object.entries(byWeek)) {
    const weekPick = typedPicks.find(
      (p) => p.games?.weeks?.week_number === parseInt(weekNum),
    );
    const weekType = (weekPick?.games?.weeks?.week_type ??
      "regular") as WeekType;
    const bonuses = distributeWeeklyBonus(userTotals, weekType, settings);

    for (const [userId, bonus] of Object.entries(bonuses)) {
      weeklyBonuses[userId] = (weeklyBonuses[userId] ?? 0) + bonus;
    }
  }

  const entries: LeaderboardEntry[] = Object.entries(byUser).map(
    ([userId, userPicks]) => {
      const profile = userPicks[0].profiles;
      const pickPoints = userPicks.reduce(
        (sum, p) => sum + (p.points_awarded ?? 0),
        0,
      );
      const weeklyBonus = weeklyBonuses[userId] ?? 0;

      const playoffPoints = userPicks
        .filter((p) => p.games?.weeks?.week_type !== "regular")
        .reduce((sum, p) => sum + (p.points_awarded ?? 0), 0);

      const pointsByWeek = userPicks.reduce(
        (acc, p) => {
          const week = p.games?.weeks?.week_number ?? 0;
          acc[week] = (acc[week] ?? 0) + (p.points_awarded ?? 0);
          return acc;
        },
        {} as Record<number, number>,
      );

      return {
        user_id: userId,
        username: profile?.username ?? "Unknown",
        avatar_color: profile?.avatar_color ?? "#f5a623",
        total_points: pickPoints + weeklyBonus,
        playoff_points: playoffPoints,
        weekly_wins: countWeeklyWins(userId, byWeek),
        correct_picks: userPicks.filter((p) => p.is_correct).length,
        sole_correct_picks: userPicks.filter((p) => p.is_sole_correct).length,
        points_by_week: pointsByWeek,
      };
    },
  );

  return sortLeaderboard(entries, settings);
}

// ─── Tiebreaker Sort ──────────────────────────────────────────

let _superBowlActual: number | null = null;
let _superBowlPredictions: Record<string, number> = {};

export function initTiebreaker(
  actual: number | null,
  predictions: Record<string, number>,
): void {
  _superBowlActual = actual;
  _superBowlPredictions = predictions;
}

function getSuperBowlDiff(userId: string): number {
  if (_superBowlActual === null) return 0;
  const prediction = _superBowlPredictions[userId];
  if (prediction === undefined) return Infinity;
  return Math.abs(_superBowlActual - prediction);
}

export function sortLeaderboard(
  entries: LeaderboardEntry[],
  settings: SeasonSettings,
): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.total_points !== a.total_points)
      return b.total_points - a.total_points;

    if (settings.tiebreaker_superbowl_pred) {
      const diff = getSuperBowlDiff(a.user_id) - getSuperBowlDiff(b.user_id);
      if (diff !== 0) return diff;
    }

    if (settings.tiebreaker_playoff_pts) {
      if (b.playoff_points !== a.playoff_points)
        return b.playoff_points - a.playoff_points;
    }

    return 0;
  });
}

function countWeeklyWins(
  userId: string,
  byWeek: Record<number, Record<string, number>>,
): number {
  return Object.values(byWeek).filter((weekTotals) => {
    const max = Math.max(...Object.values(weekTotals));
    return weekTotals[userId] === max;
  }).length;
}
