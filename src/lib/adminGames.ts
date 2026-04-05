import { supabase } from "./supabase";
import type { WeekType } from "../types";

// ─── Types ───────────────────────────────────────────────────

export interface AdminGame {
  id: string;
  week_id: string;
  home_team: string;
  home_abbr: string;
  away_team: string;
  away_abbr: string;
  kickoff_time: string;
  status: string;
  period: number | null;
  display_clock: string | null;
  home_score: string | null;
  away_score: string | null;
  possession: string | null;
  down_distance: string | null;
  last_play: string | null;
  is_red_zone: boolean | null;
}

export interface AdminWeek {
  id: string;
  week_number: number;
  week_type: WeekType;
  games: AdminGame[];
}

export interface LiveGameStateInput {
  status: string;
  period: number | null;
  display_clock: string | null;
  home_score: string | null;
  away_score: string | null;
  possession: string | null;
  down_distance: string | null;
  last_play: string | null;
  is_red_zone: boolean | null;
}

// ─── Fetch Season Games ──────────────────────────────────────

export async function getSeasonGames(
  seasonId: string,
): Promise<AdminWeek[]> {
  const { data: weeks, error: weekError } = await supabase
    .from("nfl_weeks")
    .select("id, week_number, week_type")
    .eq("season_id", seasonId)
    .order("week_number", { ascending: true });

  if (weekError) {
    throw weekError;
  }
  if (!weeks || weeks.length === 0) {
    return [];
  }

  const weekIds = weeks.map((w) => w.id);

  const { data: games, error: gameError } = await supabase
    .from("games")
    .select(
      `
      id,
      week_id,
      home_team,
      home_abbr,
      away_team,
      away_abbr,
      kickoff_time,
      live_game_state (
        status,
        period,
        display_clock,
        home_score,
        away_score,
        possession,
        down_distance,
        last_play,
        is_red_zone
      )
    `,
    )
    .in("week_id", weekIds)
    .order("kickoff_time", { ascending: true });

  if (gameError) {
    throw gameError;
  }

  const gamesByWeek = new Map<string, AdminGame[]>();

  for (const g of games ?? []) {
    const state = Array.isArray(g.live_game_state)
      ? g.live_game_state[0]
      : g.live_game_state;

    const adminGame: AdminGame = {
      id: g.id,
      week_id: g.week_id,
      home_team: g.home_team,
      home_abbr: g.home_abbr,
      away_team: g.away_team,
      away_abbr: g.away_abbr,
      kickoff_time: g.kickoff_time,
      status: state?.status ?? "STATUS_SCHEDULED",
      period: state?.period ?? null,
      display_clock: state?.display_clock ?? null,
      home_score: state?.home_score ?? null,
      away_score: state?.away_score ?? null,
      possession: state?.possession ?? null,
      down_distance: state?.down_distance ?? null,
      last_play: state?.last_play ?? null,
      is_red_zone: state?.is_red_zone ?? null,
    };

    const list = gamesByWeek.get(g.week_id) ?? [];
    list.push(adminGame);
    gamesByWeek.set(g.week_id, list);
  }

  return weeks.map((w) => ({
    id: w.id,
    week_number: w.week_number,
    week_type: w.week_type as WeekType,
    games: gamesByWeek.get(w.id) ?? [],
  }));
}

// ─── Upsert Live Game State ──────────────────────────────────

export async function upsertLiveGameState(
  gameId: string,
  state: LiveGameStateInput,
): Promise<void> {
  const { error } = await supabase
    .from("live_game_state")
    .upsert({ game_id: gameId, ...state }, { onConflict: "game_id" });

  if (error) {
    throw error;
  }
}

// ─── Reset to Defaults ───────────────────────────────────────

export async function resetLiveGameState(gameId: string): Promise<void> {
  await upsertLiveGameState(gameId, {
    status: "STATUS_SCHEDULED",
    period: null,
    display_clock: null,
    home_score: null,
    away_score: null,
    possession: null,
    down_distance: null,
    last_play: null,
    is_red_zone: false,
  });
}

// ─── Generate Simulated State ────────────────────────────────

export function generateSimulatedState(game: AdminGame): LiveGameStateInput {
  const period = Math.ceil(Math.random() * 4);
  const minutes = Math.floor(Math.random() * 15);
  const seconds = Math.floor(Math.random() * 60);
  const down = Math.ceil(Math.random() * 4);
  const distance = Math.ceil(Math.random() * 15);

  return {
    status: "STATUS_IN_PROGRESS",
    period,
    display_clock: `${minutes}:${seconds.toString().padStart(2, "0")}`,
    home_score: String(Math.floor(Math.random() * 35)),
    away_score: String(Math.floor(Math.random() * 35)),
    possession: Math.random() > 0.5 ? game.home_abbr : game.away_abbr,
    down_distance: `${down}${ordinalSuffix(down)} & ${distance}`,
    last_play: null,
    is_red_zone: Math.random() > 0.7,
  };
}

function ordinalSuffix(n: number): string {
  if (n === 1) {
    return "st";
  }
  if (n === 2) {
    return "nd";
  }
  if (n === 3) {
    return "rd";
  }
  return "th";
}
