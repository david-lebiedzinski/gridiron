import { supabase } from "./client";
import type {
  GameInsert,
  SeasonInsert,
  TeamInsert,
  WeekInsert,
} from "./types";

// ─── Constants ───────────────────────────────────────────────

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

const PHASE_MAP: Record<string, "pre" | "reg" | "post"> = {
  "1": "pre",
  "2": "reg",
  "3": "post",
};

const STATUS_MAP: Record<string, string> = {
  STATUS_SCHEDULED: "scheduled",
  STATUS_IN_PROGRESS: "in_progress",
  STATUS_HALFTIME: "halftime",
  STATUS_FINAL: "final",
  STATUS_END_PERIOD: "in_progress",
};

// ─── Types ───────────────────────────────────────────────────

export interface SyncResult {
  season: { year: number; created: boolean };
  weeks: number;
  games: number;
}

interface ESPNCalendarEntry {
  label: string;
  value: string;
  detail?: string;
  startDate: string;
  endDate: string;
}

interface ESPNCalendarSection {
  label: string;
  value: string;
  startDate: string;
  endDate: string;
  entries: ESPNCalendarEntry[];
}

interface ESPNLeagueSeason {
  year: number;
  startDate: string;
  endDate: string;
}

interface ESPNLeague {
  season: ESPNLeagueSeason;
  calendar: ESPNCalendarSection[];
}

interface ESPNTeamRaw {
  id: string;
  abbreviation: string;
  location?: string;
  name?: string;
  displayName: string;
  color?: string;
  alternateColor?: string;
}

interface ESPNRecord {
  type: string;
  summary: string;
}

interface ESPNNote {
  type: string;
  headline: string;
}

interface ESPNCompetitorRaw {
  homeAway: string;
  winner?: boolean;
  score?: string;
  team: ESPNTeamRaw;
  records?: ESPNRecord[];
}

interface ESPNOddsRaw {
  details?: string;
}

interface ESPNSituationRaw {
  possession?: string;
  downDistanceText?: string;
  lastPlay?: { text?: string };
  isRedZone?: boolean;
}

interface ESPNCompetitionRaw {
  notes?: ESPNNote[];
  competitors: ESPNCompetitorRaw[];
  odds?: ESPNOddsRaw[];
  situation?: ESPNSituationRaw;
}

interface ESPNStatusRaw {
  type: { name: string };
  period?: number;
  displayClock?: string;
}

interface ESPNEventRaw {
  id: string;
  date: string;
  status: ESPNStatusRaw;
  competitions: ESPNCompetitionRaw[];
}

interface ESPNScoreboardResponse {
  leagues?: ESPNLeague[];
  events?: ESPNEventRaw[];
}

interface WeekContext {
  id: string;
  phase: "pre" | "reg" | "post";
  espnValue: number;
  seasonYear: number;
}

// ─── Helpers ─────────────────────────────────────────────────

function mapStatus(espnStatus: string): string {
  return STATUS_MAP[espnStatus] ?? "scheduled";
}

function stripHash(color: string | undefined | null): string | null {
  if (!color) {
    return null;
  }
  return color.startsWith("#") ? color.slice(1) : color;
}

function toDate(iso: string): string {
  return iso.split("T")[0];
}

function extractRecord(competitor: ESPNCompetitorRaw): string | null {
  const rec = competitor.records?.find((r) => r.type === "total");
  return rec?.summary ?? null;
}

function parseSpread(
  details: string | undefined,
  homeAbbr: string,
): number | null {
  if (!details) {
    return null;
  }
  const match = details.match(/^([A-Z]{2,4})\s+([+-]?\d+(\.\d+)?)/);
  if (!match) {
    return null;
  }
  const teamCode = match[1];
  const value = parseFloat(match[2]);
  if (Number.isNaN(value)) {
    return null;
  }
  return teamCode === homeAbbr ? value : -value;
}

function extractHeadline(comp: ESPNCompetitionRaw): string | null {
  const note = comp.notes?.find((n) => n.type === "event");
  return note?.headline ?? null;
}

function countsForStandings(
  phase: "pre" | "reg" | "post",
  label: string,
): boolean {
  if (phase === "pre") {
    return false;
  }
  if (label === "Pro Bowl") {
    return false;
  }
  return true;
}

// ─── Fetch ───────────────────────────────────────────────────

async function fetchScoreboard(
  query: string,
): Promise<ESPNScoreboardResponse> {
  const url = query ? `${ESPN_BASE}/scoreboard?${query}` : `${ESPN_BASE}/scoreboard`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ESPN API error ${res.status} for ${url}`);
  }
  return (await res.json()) as ESPNScoreboardResponse;
}

async function fetchWeekEvents(
  year: number,
  seasonType: number,
  week: number,
): Promise<ESPNEventRaw[]> {
  const data = await fetchScoreboard(
    `dates=${year}&seasontype=${seasonType}&week=${week}`,
  );
  return data.events ?? [];
}

// ─── Team upsert ─────────────────────────────────────────────

async function upsertTeam(
  raw: ESPNTeamRaw,
  cache: Map<string, string>,
): Promise<string> {
  const cached = cache.get(raw.id);
  if (cached) {
    return cached;
  }

  const insert: TeamInsert = {
    espn_id: raw.id,
    abbr: raw.abbreviation,
    location: raw.location ?? "",
    name: raw.name ?? "",
    display_name: raw.displayName,
    color: stripHash(raw.color),
    alternate_color: stripHash(raw.alternateColor),
  };

  const { data, error } = await supabase
    .from("team")
    .upsert(insert, { onConflict: "espn_id" })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error(`Failed to upsert team ${raw.abbreviation}`);
  }

  cache.set(raw.id, data.id);
  return data.id;
}

// ─── Week games sync (internal) ──────────────────────────────

async function syncWeekEvents(
  ctx: WeekContext,
  teamCache: Map<string, string>,
): Promise<number> {
  const seasonTypeNum = ctx.phase === "pre" ? 1 : ctx.phase === "reg" ? 2 : 3;
  const events = await fetchWeekEvents(
    ctx.seasonYear,
    seasonTypeNum,
    ctx.espnValue,
  );

  if (events.length === 0) {
    return 0;
  }

  const rows: GameInsert[] = [];

  for (const event of events) {
    const comp = event.competitions[0];
    if (!comp) {
      continue;
    }

    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) {
      continue;
    }

    const homeTeamId = await upsertTeam(home.team, teamCache);
    const awayTeamId = await upsertTeam(away.team, teamCache);

    const status = mapStatus(event.status.type.name);
    const situation = comp.situation ?? null;
    const oddsDetails = comp.odds?.[0]?.details;
    const spread = parseSpread(oddsDetails, home.team.abbreviation);

    let possessionId: string | null = null;
    if (situation?.possession) {
      possessionId = teamCache.get(situation.possession) ?? null;
    }

    let winnerId: string | null = null;
    if (status === "final") {
      const winnerComp = comp.competitors.find((c) => c.winner);
      if (winnerComp) {
        winnerId =
          winnerComp.homeAway === "home" ? homeTeamId : awayTeamId;
      }
    }

    const row: GameInsert = {
      week_id: ctx.id,
      espn_event_id: event.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_team_record: extractRecord(home),
      away_team_record: extractRecord(away),
      headline: extractHeadline(comp),
      kickoff_time: event.date,
      status,
      home_score: home.score != null ? Number(home.score) : 0,
      away_score: away.score != null ? Number(away.score) : 0,
      spread,
      period: event.status.period ?? null,
      display_clock: event.status.displayClock ?? null,
      possession_id: possessionId,
      down_distance: situation?.downDistanceText ?? null,
      last_play: situation?.lastPlay?.text ?? null,
      is_red_zone: situation?.isRedZone ?? false,
      winner_id: winnerId,
    };

    rows.push(row);
  }

  if (rows.length === 0) {
    return 0;
  }

  const { error } = await supabase
    .from("game")
    .upsert(rows, { onConflict: "espn_event_id" });

  if (error) {
    throw error;
  }

  return rows.length;
}

// ─── Public: syncFromESPN ────────────────────────────────────

export async function syncFromESPN(): Promise<SyncResult> {
  const scoreboard = await fetchScoreboard("");
  const league = scoreboard.leagues?.[0];
  if (!league) {
    throw new Error("ESPN scoreboard returned no league data");
  }

  const year = league.season.year;

  // Check whether this season already exists
  const { data: existing } = await supabase
    .from("season")
    .select("id")
    .eq("year", year)
    .maybeSingle();

  const seasonInsert: SeasonInsert = {
    year,
    start_date: toDate(league.season.startDate),
    end_date: toDate(league.season.endDate),
    last_synced_at: new Date().toISOString(),
  };

  const { data: seasonRow, error: seasonError } = await supabase
    .from("season")
    .upsert(seasonInsert, { onConflict: "year" })
    .select("id")
    .single();

  if (seasonError || !seasonRow) {
    throw seasonError ?? new Error("Failed to upsert season");
  }

  const seasonId = seasonRow.id;
  const teamCache = new Map<string, string>();
  let totalWeeks = 0;
  let totalGames = 0;

  for (const section of league.calendar) {
    const phase = PHASE_MAP[section.value];
    if (!phase) {
      continue;
    }

    for (const entry of section.entries) {
      const espnValue = Number(entry.value);
      if (!Number.isFinite(espnValue)) {
        continue;
      }

      const weekInsert: WeekInsert = {
        season_id: seasonId,
        phase,
        espn_value: espnValue,
        label: entry.label,
        detail: entry.detail ?? null,
        start_date: toDate(entry.startDate),
        end_date: toDate(entry.endDate),
        counts_for_standings: countsForStandings(phase, entry.label),
      };

      const { data: weekRow, error: weekError } = await supabase
        .from("week")
        .upsert(weekInsert, { onConflict: "season_id,phase,espn_value" })
        .select("id")
        .single();

      if (weekError || !weekRow) {
        throw weekError ?? new Error("Failed to upsert week");
      }

      totalWeeks++;

      const gameCount = await syncWeekEvents(
        {
          id: weekRow.id,
          phase,
          espnValue,
          seasonYear: year,
        },
        teamCache,
      );
      totalGames += gameCount;
    }
  }

  return {
    season: { year, created: !existing },
    weeks: totalWeeks,
    games: totalGames,
  };
}

// ─── Public: syncCurrentWeek ─────────────────────────────────

export async function syncCurrentWeek(): Promise<{ games: number }> {
  const { data: seasonRow, error: seasonError } = await supabase
    .from("season")
    .select("id, year")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (seasonError) {
    throw seasonError;
  }
  if (!seasonRow) {
    throw new Error("No season found — run syncFromESPN() first");
  }

  const today = new Date().toISOString().split("T")[0];

  // Try to find the week containing today
  const { data: activeWeek } = await supabase
    .from("week")
    .select("id, phase, espn_value")
    .eq("season_id", seasonRow.id)
    .lte("start_date", today)
    .gte("end_date", today)
    .limit(1)
    .maybeSingle();

  let weekRow = activeWeek;

  // Fall back to next upcoming week
  if (!weekRow) {
    const { data: upcoming, error: upcomingError } = await supabase
      .from("week")
      .select("id, phase, espn_value")
      .eq("season_id", seasonRow.id)
      .gte("start_date", today)
      .order("start_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (upcomingError) {
      throw upcomingError;
    }
    weekRow = upcoming;
  }

  if (!weekRow) {
    return { games: 0 };
  }

  const phase = weekRow.phase as "pre" | "reg" | "post";
  const teamCache = new Map<string, string>();

  const games = await syncWeekEvents(
    {
      id: weekRow.id,
      phase,
      espnValue: weekRow.espn_value,
      seasonYear: seasonRow.year,
    },
    teamCache,
  );

  return { games };
}
