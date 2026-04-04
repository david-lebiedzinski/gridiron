import { supabase } from "./supabase";
import type { ESPNGame } from "../types";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

// Re-export for consumers
export type { ESPNGame };

// ─── ESPN Event Shape (untyped API response) ─────────────────

interface ESPNCompetitor {
  homeAway: string;
  winner?: boolean;
  score?: string;
  team: {
    abbreviation: string;
    displayName: string;
    logo: string;
    color: string;
    alternateColor: string;
  };
}

interface ESPNEvent {
  id: string;
  date: string;
  status: {
    type: { name: string };
    period?: number;
    displayClock?: string;
  };
  competitions: {
    competitors: ESPNCompetitor[];
    odds?: { details: string; overUnder: number }[];
    situation?: {
      possessionText?: string;
      downDistanceText?: string;
      lastPlay?: { text: string };
      isRedZone?: boolean;
    };
  }[];
}

// ─── Fetch Week Schedule ──────────────────────────────────────

export async function fetchWeekSchedule(
  year: number,
  week: number,
  seasonType: "regular" | "post" = "regular",
): Promise<ESPNGame[]> {
  const espnSeasonType = seasonType === "post" ? 3 : 2;
  const res = await fetch(
    `${ESPN_BASE}/scoreboard?year=${year}&week=${week}&seasontype=${espnSeasonType}`,
  );

  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  const data = await res.json();

  return (data.events ?? []).map(parseESPNEvent);
}

// ─── Fetch Single Game ────────────────────────────────────────

export async function fetchSingleGame(espnGameId: string): Promise<ESPNGame> {
  const res = await fetch(`${ESPN_BASE}/summary?event=${espnGameId}`);
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);
  const data = await res.json();

  const event: ESPNEvent = {
    id: espnGameId,
    date: data.header.competitions[0].date,
    status: data.header.competitions[0].status,
    competitions: [data.header.competitions[0]],
  };

  return parseESPNEvent(event);
}

// ─── Parse ESPN Event ─────────────────────────────────────────

function parseESPNEvent(event: ESPNEvent): ESPNGame {
  const competition = event.competitions[0];
  const home = competition.competitors.find((c) => c.homeAway === "home")!;
  const away = competition.competitors.find((c) => c.homeAway === "away")!;
  const odds = competition.odds?.[0] ?? null;
  const situation = competition.situation ?? null;
  const status = event.status.type.name;

  const favoriteAbbr = odds ? parseFavorite(odds.details) : null;
  const winner =
    status === "STATUS_FINAL"
      ? (competition.competitors.find((c) => c.winner)?.team.abbreviation ??
        null)
      : null;

  return {
    espnGameId: event.id,
    kickoffTime: event.date,
    homeTeam: home.team.displayName,
    homeAbbr: home.team.abbreviation,
    homeLogo: home.team.logo,
    homeColor: `#${home.team.color}`,
    homeAltColor: `#${home.team.alternateColor}`,
    awayTeam: away.team.displayName,
    awayAbbr: away.team.abbreviation,
    awayLogo: away.team.logo,
    awayColor: `#${away.team.color}`,
    awayAltColor: `#${away.team.alternateColor}`,
    spread: odds?.details ?? null,
    overUnder: odds?.overUnder ?? null,
    favoriteAbbr,
    status,
    winner,
    period: event.status.period,
    displayClock: event.status.displayClock,
    homeScore: home.score,
    awayScore: away.score,
    possession: situation?.possessionText,
    downDistance: situation?.downDistanceText,
    lastPlay: situation?.lastPlay?.text,
    isRedZone: situation?.isRedZone ?? false,
  };
}

// ─── Parse Spread ─────────────────────────────────────────────

function parseFavorite(details: string | null): string | null {
  if (!details || details === "EVEN") return null;
  const match = details.match(/^([A-Z]+)\s+[-][\d.]+$/);
  return match ? match[1] : null;
}

export function isUpset(spread: string | null, winnerAbbr: string): boolean {
  if (!spread || spread === "EVEN") return false;
  const favorite = parseFavorite(spread);
  if (!favorite) return false;
  return winnerAbbr !== favorite;
}

// ─── Sync Week Games to Supabase ──────────────────────────────

export async function syncWeekGames(
  weekId: string,
  year: number,
  weekNumber: number,
  seasonType: "regular" | "post",
): Promise<number> {
  const espnGames = await fetchWeekSchedule(year, weekNumber, seasonType);

  for (const game of espnGames) {
    await supabase.from("games").upsert(
      {
        week_id: weekId,
        espn_game_id: game.espnGameId,
        home_team: game.homeTeam,
        home_abbr: game.homeAbbr,
        away_team: game.awayTeam,
        away_abbr: game.awayAbbr,
        spread: game.spread,
        kickoff_time: game.kickoffTime,
        winner_abbr: game.winner,
      },
      { onConflict: "espn_game_id" },
    );
  }

  return espnGames.length;
}

// ─── Logo URL Helper ──────────────────────────────────────────

export function getTeamLogoUrl(abbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;
}
