import { supabase } from "./client";
import type {
  GameInsert,
  GameUpdate,
  ESPNCompetitor,
  ESPNEvent,
} from "./types";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

// ─── Status mapping ──────────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  STATUS_SCHEDULED: "scheduled",
  STATUS_IN_PROGRESS: "in_progress",
  STATUS_HALFTIME: "halftime",
  STATUS_FINAL: "final",
  STATUS_END_PERIOD: "in_progress",
};

function mapStatus(espnStatus: string): string {
  return STATUS_MAP[espnStatus] ?? "scheduled";
}

// ─── Team ID lookup ──────────────────────────────────────────

async function loadTeamMap(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("team").select("id, abbr");

  if (error) {
    throw error;
  }

  const map = new Map<string, string>();
  for (const t of data) {
    map.set(t.abbr, t.id);
  }
  return map;
}

// ─── Fetch week schedule from ESPN ───────────────────────────

export async function fetchWeekSchedule(
  year: number,
  week: number,
  seasonType: "regular" | "post" = "regular",
): Promise<ESPNEvent[]> {
  const espnSeasonType = seasonType === "post" ? 3 : 2;
  const res = await fetch(
    `${ESPN_BASE}/scoreboard?year=${year}&week=${week}&seasontype=${espnSeasonType}`,
  );

  if (!res.ok) {
    throw new Error(`ESPN API error: ${res.status}`);
  }

  const data = await res.json();
  return data.events ?? [];
}

// ─── Sync a week's games to Supabase ─────────────────────────

export async function syncWeekGames(
  seasonId: string,
  weekId: string,
  year: number,
  weekNumber: number,
  seasonType: "regular" | "post",
): Promise<number> {
  const [events, teamMap] = await Promise.all([
    fetchWeekSchedule(year, weekNumber, seasonType),
    loadTeamMap(),
  ]);

  const games: GameInsert[] = events.map((event) => {
    const comp = event.competitions[0];
    const home = comp.competitors.find((c) => c.homeAway === "home")!;
    const away = comp.competitors.find((c) => c.homeAway === "away")!;
    const odds = comp.odds?.[0] ?? null;
    const status = mapStatus(event.status.type.name);

    const homeTeamId = teamMap.get(home.team.abbreviation);
    const awayTeamId = teamMap.get(away.team.abbreviation);

    if (!homeTeamId || !awayTeamId) {
      throw new Error(
        `Unknown team: ${home.team.abbreviation} or ${away.team.abbreviation}`,
      );
    }

    const winnerId =
      status === "final"
        ? (teamMap.get(
            comp.competitors.find((c) => c.winner)?.team.abbreviation ?? "",
          ) ?? null)
        : null;

    const spread = odds ? parseSpread(odds.details) : null;

    return {
      season_id: seasonId,
      week_id: weekId,
      espn_game_id: event.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      kickoff_time: event.date,
      status,
      home_score: home.score != null ? Number(home.score) : 0,
      away_score: away.score != null ? Number(away.score) : 0,
      spread,
      winner_id: winnerId,
    };
  });

  const { error } = await supabase
    .from("game")
    .upsert(games, { onConflict: "espn_game_id" });

  if (error) {
    throw error;
  }

  return games.length;
}

// ─── Update live state for active games ──────────────────────

export async function syncLiveGameState(seasonId: string): Promise<number> {
  const { data: activeGames, error: fetchError } = await supabase
    .from("game")
    .select("espn_game_id")
    .eq("season_id", seasonId)
    .in("status", ["scheduled", "in_progress", "halftime"]);

  if (fetchError) {
    throw fetchError;
  }
  if (!activeGames || activeGames.length === 0) {
    return 0;
  }

  const teamMap = await loadTeamMap();
  let updated = 0;

  for (const row of activeGames) {
    try {
      const res = await fetch(`${ESPN_BASE}/summary?event=${row.espn_game_id}`);
      if (!res.ok) {
        continue;
      }

      const data = await res.json();
      const comp = data.header.competitions[0];
      const home = comp.competitors.find(
        (c: ESPNCompetitor) => c.homeAway === "home",
      )!;
      const away = comp.competitors.find(
        (c: ESPNCompetitor) => c.homeAway === "away",
      )!;
      const situation = data.situation ?? null;
      const status = mapStatus(comp.status.type.name);

      const winnerId =
        status === "final"
          ? (teamMap.get(
              comp.competitors.find((c: ESPNCompetitor) => c.winner)?.team
                .abbreviation ?? "",
            ) ?? null)
          : null;

      const possessionAbbr = situation?.possessionText ?? null;
      const possessionId = possessionAbbr
        ? (teamMap.get(possessionAbbr) ?? null)
        : null;

      const updates: GameUpdate = {
        status,
        home_score: home.score != null ? Number(home.score) : 0,
        away_score: away.score != null ? Number(away.score) : 0,
        period: comp.status.period ?? null,
        display_clock: comp.status.displayClock ?? null,
        possession_id: possessionId,
        down_distance: situation?.downDistanceText ?? null,
        last_play: situation?.lastPlay?.text ?? null,
        is_red_zone: situation?.isRedZone ?? false,
        winner_id: winnerId,
      };

      const { error } = await supabase
        .from("game")
        .update(updates)
        .eq("espn_game_id", row.espn_game_id);

      if (!error) {
        updated++;
      }
    } catch {
      // Skip individual game failures
    }
  }

  return updated;
}

// ─── Spread parsing ──────────────────────────────────────────

function parseSpread(details: string | null): number | null {
  if (!details || details === "EVEN") {
    return null;
  }
  const match = details.match(/[-]?([\d.]+)$/);
  return match ? parseFloat(match[0]) : null;
}

export function isUpset(
  spread: number | null,
  winnerAbbr: string,
  homeAbbr: string,
): boolean {
  if (spread == null) {
    return false;
  }
  const favoredIsHome = spread < 0;
  const winnerIsHome = winnerAbbr === homeAbbr;
  return favoredIsHome !== winnerIsHome;
}
