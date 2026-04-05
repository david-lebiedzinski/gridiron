import { supabase } from "./supabase";
import type { WeekType } from "../types";

// ─── Grid Types ──────────────────────────────────────────────

export interface GridGame {
  id: string;
  week_id: string;
  week_number: number;
  week_type: WeekType;
  home_abbr: string;
  away_abbr: string;
  home_team: string;
  away_team: string;
  spread: number | null;
  kickoff_time: string;
  winner_abbr: string | null;
  status: "pre" | "in_progress" | "final";
  home_score: number | null;
  away_score: number | null;
  period: number | null;
  display_clock: string | null;
}

export interface GridWeek {
  week_id: string;
  week_number: number;
  week_type: WeekType;
  label: string;
  isCurrent: boolean;
  isPast: boolean;
  games: GridGame[];
}

export interface GridMember {
  user_id: string;
  username: string;
  avatar_color: string;
  total_points: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface GridPick {
  user_id: string;
  game_id: string;
  picked_team_abbr: string;
  is_correct: boolean | null;
  is_sole_correct: boolean | null;
  points_awarded: number | null;
}

export type ChipState =
  | "correct"
  | "wrong"
  | "pending"
  | "live"
  | "hidden"
  | "empty";

// ─── Fetch Season Games ──────────────────────────────────────

export async function fetchSeasonGames(
  nflSeasonId: string,
): Promise<GridGame[]> {
  // First get week IDs for this season
  const { data: weeks, error: weeksError } = await supabase
    .from("nfl_weeks")
    .select("id, week_number, week_type")
    .eq("season_id", nflSeasonId);

  if (weeksError) {
    throw weeksError;
  }
  if (!weeks?.length) {
    return [];
  }

  const weekMap = new Map(
    weeks.map((w) => [w.id, { week_number: w.week_number, week_type: w.week_type as WeekType }]),
  );
  const weekIds = weeks.map((w) => w.id);

  // Fetch games with live state
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select(
      `
      id, week_id, home_abbr, away_abbr, home_team, away_team,
      spread, kickoff_time, winner_abbr,
      live_game_state (
        status, home_score, away_score, period, display_clock
      )
    `,
    )
    .in("week_id", weekIds)
    .order("kickoff_time", { ascending: true });

  if (gamesError) {
    throw gamesError;
  }

  return (games ?? []).map((g) => {
    const week = weekMap.get(g.week_id)!;
    const live = Array.isArray(g.live_game_state)
      ? g.live_game_state[0]
      : g.live_game_state;

    let status: GridGame["status"] = "pre";
    if (g.winner_abbr) {
      status = "final";
    } else if (live?.status === "in_progress" || live?.status === "in") {
      status = "in_progress";
    } else if (live?.status === "post" || live?.status === "final") {
      status = "final";
    }

    return {
      id: g.id,
      week_id: g.week_id,
      week_number: week.week_number,
      week_type: week.week_type,
      home_abbr: g.home_abbr,
      away_abbr: g.away_abbr,
      home_team: g.home_team,
      away_team: g.away_team,
      spread: g.spread != null ? Number(g.spread) : null,
      kickoff_time: g.kickoff_time,
      winner_abbr: g.winner_abbr,
      status,
      home_score: live?.home_score ?? null,
      away_score: live?.away_score ?? null,
      period: live?.period ?? null,
      display_clock: live?.display_clock ?? null,
    };
  });
}

// ─── Fetch League Picks ──────────────────────────────────────

export async function fetchLeaguePicks(
  leagueSeasonId: string,
): Promise<GridPick[]> {
  // Supabase defaults to 1000 rows; a full season with 9 users can exceed that
  const all: GridPick[] = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("picks")
      .select(
        "user_id, game_id, picked_team_abbr, is_correct, is_sole_correct, points_awarded",
      )
      .eq("league_season_id", leagueSeasonId)
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    all.push(...(data as GridPick[]));

    if (!data || data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return all;
}

// ─── Upsert Pick ─────────────────────────────────────────────

export async function upsertPick(
  userId: string,
  gameId: string,
  leagueSeasonId: string,
  pickedTeamAbbr: string,
): Promise<void> {
  const { error } = await supabase.from("picks").upsert(
    {
      user_id: userId,
      game_id: gameId,
      league_season_id: leagueSeasonId,
      picked_team_abbr: pickedTeamAbbr,
      picked_at: new Date().toISOString(),
    },
    { onConflict: "user_id,game_id,league_season_id" },
  );

  if (error) {
    throw error;
  }
}

// ─── Delete Pick ─────────────────────────────────────────────

export async function deletePick(
  userId: string,
  gameId: string,
  leagueSeasonId: string,
): Promise<void> {
  const { error } = await supabase
    .from("picks")
    .delete()
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .eq("league_season_id", leagueSeasonId);

  if (error) {
    throw error;
  }
}

// ─── Helpers ─────────────────────────────────────────────────

export function getCurrentWeekNumber(games: GridGame[]): number {
  const now = new Date();
  let latestWeek = 1;

  for (const game of games) {
    if (new Date(game.kickoff_time) <= now || game.status !== "pre") {
      if (game.week_number > latestWeek) {
        latestWeek = game.week_number;
      }
    }
  }

  return latestWeek;
}

export function deriveChipState(
  pick: GridPick | undefined,
  game: GridGame,
  isCurrentUser: boolean,
  picksVisibleBeforeKickoff: boolean,
): ChipState {
  if (!pick) {
    return "empty";
  }

  if (game.winner_abbr) {
    return pick.picked_team_abbr === game.winner_abbr ? "correct" : "wrong";
  }

  if (game.status === "final") {
    // Game final but no winner set yet
    return pick.is_correct ? "correct" : "pending";
  }

  if (game.status === "in_progress") {
    return "live";
  }

  // Pre-kickoff
  if (isCurrentUser) {
    return "pending";
  }

  if (picksVisibleBeforeKickoff) {
    return "pending";
  }

  return "hidden";
}

export function isGameLocked(_game: GridGame): boolean {
  // TODO: re-enable lock check
  // return (
  //   game.status !== "pre" || new Date(game.kickoff_time) <= new Date()
  // );
  return false;
}

export function buildWeekLabel(weekNumber: number, weekType: WeekType): string {
  switch (weekType) {
    case "wildcard":
      return "\uD83E\uDD48  Playoffs \u00B7 Wild Card";
    case "divisional":
      return "\uD83E\uDD48  Playoffs \u00B7 Divisional Round";
    case "championship":
      return "\uD83E\uDD48  Playoffs \u00B7 Conference Championship";
    case "superbowl":
      return "\uD83C\uDFC6  Super Bowl";
    default:
      return `Regular Season \u00B7 Week ${weekNumber}`;
  }
}

export function groupGamesByWeek(
  games: GridGame[],
  currentWeekNumber: number,
): GridWeek[] {
  const weekMap = new Map<string, GridWeek>();

  for (const game of games) {
    let week = weekMap.get(game.week_id);
    if (!week) {
      week = {
        week_id: game.week_id,
        week_number: game.week_number,
        week_type: game.week_type,
        label: buildWeekLabel(game.week_number, game.week_type),
        isCurrent: game.week_number === currentWeekNumber,
        isPast: game.week_number < currentWeekNumber,
        games: [],
      };
      weekMap.set(game.week_id, week);
    }
    week.games.push(game);
  }

  return Array.from(weekMap.values()).sort(
    (a, b) => b.week_number - a.week_number,
  );
}
