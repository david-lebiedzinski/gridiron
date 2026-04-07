import type { Database } from "./schema";

// ─── ESPN API Shapes ─────────────────────────────────────────

/** ESPN team info nested within a competitor */
export interface ESPNTeam {
  /** Team abbreviation (e.g. "NE") */
  abbreviation: string;
  /** Full team name (e.g. "New England Patriots") */
  displayName: string;
  /** URL to team logo image */
  logo: string;
  /** Primary team color hex (e.g. "002244") */
  color: string;
  /** Alternate team color hex */
  alternateColor: string;
}

/** A team in an ESPN competition (home or away side) */
export interface ESPNCompetitor {
  /** "home" or "away" */
  homeAway: string;
  /** Whether this team won — only set when game is final */
  winner?: boolean;
  /** Current score as a string (e.g. "24") */
  score?: string;
  /** Team details */
  team: ESPNTeam;
}

/** Betting odds for a game */
export interface ESPNOdds {
  /** Spread line (e.g. "NE -3.5") */
  details: string;
  /** Over/under total points */
  overUnder: number;
}

/** Description of the most recent play */
export interface ESPNLastPlay {
  /** Human-readable play description */
  text: string;
}

/** Live game situation — possession, down, field position */
export interface ESPNSituation {
  /** Team with possession (e.g. "NE") */
  possessionText?: string;
  /** Down and distance (e.g. "3rd & 7 at NE 45") */
  downDistanceText?: string;
  /** Most recent play */
  lastPlay?: ESPNLastPlay;
  /** Whether the offense is inside the 20-yard line */
  isRedZone?: boolean;
}

/** Status type identifier from ESPN */
export interface ESPNStatusType {
  /** Status enum name (e.g. "STATUS_SCHEDULED", "STATUS_IN_PROGRESS", "STATUS_FINAL") */
  name: string;
}

/** Game status and clock info */
export interface ESPNStatus {
  /** Status type with enum name */
  type: ESPNStatusType;
  /** Current quarter (1-4) or overtime period */
  period?: number;
  /** Game clock display (e.g. "5:32") */
  displayClock?: string;
}

/** A single competition within an ESPN event */
export interface ESPNCompetition {
  /** Home and away competitors */
  competitors: ESPNCompetitor[];
  /** Betting odds — first entry is the primary line */
  odds?: ESPNOdds[];
  /** Live game situation (possession, down, etc.) */
  situation?: ESPNSituation;
}

/** A single game event from the ESPN scoreboard API */
export interface ESPNEvent {
  /** ESPN's unique game identifier */
  id: string;
  /** Kickoff time as ISO string */
  date: string;
  /** Game status and clock info */
  status: ESPNStatus;
  /** Game details — typically one competition per event */
  competitions: ESPNCompetition[];
}

// ─── Database Types ──────────────────────────────────────────

type Tables = Database["public"]["Tables"];

// ─── Team ────────────────────────────────────────────────────

export type Team = Tables["team"]["Row"];
export type TeamInsert = Tables["team"]["Insert"];
export type TeamUpdate = Tables["team"]["Update"];

// ─── Season ──────────────────────────────────────────────────

export type Season = Tables["season"]["Row"];
export type SeasonInsert = Tables["season"]["Insert"];
export type SeasonUpdate = Tables["season"]["Update"];

// ─── Week ────────────────────────────────────────────────────

export type Week = Tables["week"]["Row"];
export type WeekInsert = Tables["week"]["Insert"];
export type WeekUpdate = Tables["week"]["Update"];

// ─── Game ────────────────────────────────────────────────────

export type Game = Tables["game"]["Row"];
export type GameInsert = Tables["game"]["Insert"];
export type GameUpdate = Tables["game"]["Update"];

// ─── Profile ─────────────────────────────────────────────────

export type Profile = Tables["profile"]["Row"];
export type ProfileInsert = Tables["profile"]["Insert"];
export type ProfileUpdate = Tables["profile"]["Update"];

// ─── League ──────────────────────────────────────────────────

export type League = Tables["league"]["Row"];
export type LeagueInsert = Tables["league"]["Insert"];
export type LeagueUpdate = Tables["league"]["Update"];

// ─── League Member ───────────────────────────────────────────

export type LeagueMember = Tables["league_member"]["Row"];
export type LeagueMemberInsert = Tables["league_member"]["Insert"];

// ─── Pick ────────────────────────────────────────────────────

export type Pick = Tables["pick"]["Row"];
export type PickInsert = Tables["pick"]["Insert"];
export type PickUpdate = Tables["pick"]["Update"];

// ─── Week Bonus ──────────────────────────────────────────────

export type WeekBonus = Tables["week_bonus"]["Row"];
export type WeekBonusInsert = Tables["week_bonus"]["Insert"];
