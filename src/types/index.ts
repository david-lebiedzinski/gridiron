// ─── Profile ─────────────────────────────────────────────────

export interface Profile {
  id: string;
  username: string;
  avatar_color: string;
  avatar_url: string | null;
  favorite_team: string | null;
  theme_intensity: "off" | "subtle" | "normal" | "full";
  is_super_admin: boolean;
}

export interface ProfileUpdate {
  username?: string;
  avatar_color?: string;
  avatar_url?: string | null;
  favorite_team?: string | null;
  theme_intensity?: "off" | "subtle" | "normal" | "full";
}

// ─── League ──────────────────────────────────────────────────

export interface League {
  id: string;
  name: string;
  invite_code: string;
  commissioner_id: string;
  league_seasons: LeagueSeason[];
}

export interface LeagueSeason {
  id: string;
  name: string;
  is_active: boolean;
  locked: boolean;
  nfl_seasons: { year: number };
}

export interface LeagueMembership {
  role: "commissioner" | "member";
  stats_visibility: "league_default" | "public" | "private";
  joined_at: string;
  leagues: League;
}

export interface JoinLeagueResult {
  league_id: string;
  league_name: string;
}

// ─── Scoring ─────────────────────────────────────────────────

export type WeekType =
  | "regular"
  | "wildcard"
  | "divisional"
  | "championship"
  | "superbowl";

export interface SeasonSettings {
  base_correct_pts: number;
  upset_multiplier: number;
  sole_correct_bonus: number;
  wildcard_multiplier: number;
  divisional_multiplier: number;
  championship_multiplier: number;
  superbowl_multiplier: number;
  weekly_bonus_regular: number;
  weekly_bonus_scales: boolean;
  tiebreaker_superbowl_pred: boolean;
  tiebreaker_playoff_pts: boolean;
  stats_public_default?: boolean;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_color: string;
  total_points: number;
  playoff_points: number;
  weekly_wins: number;
  correct_picks: number;
  sole_correct_picks: number;
  points_by_week: Record<number, number>;
}

// ─── Analytics ───────────────────────────────────────────────

export interface TeamPickRecord {
  team: string;
  picked: number;
  correct: number;
  winRate: number;
  upsets: number;
  soleCorrect: number;
}

export interface PickingRates {
  total: number;
  correct: number;
  correctRate: number;
  upsetPickRate: number;
  upsetSuccessRate: number;
  contrarianRate: number;
}

export interface TimeSlotStat {
  slot: string;
  label: string;
  picked: number;
  correct: number;
  winRate: number;
  points: number;
}

export interface WeekStat {
  week: number;
  points: number;
  correct: number;
  total: number;
  winRate: number;
}

export interface WeeklyPatterns {
  weeks: WeekStat[];
  bestWeek: WeekStat;
  worstWeek: WeekStat;
  averagePointsPerWeek: number;
}

export interface HeadToHeadRecord {
  wins: number;
  losses: number;
  ties: number;
  record: string;
}

export interface HeadToHeadEntry extends HeadToHeadRecord {
  opponent: { username: string; avatar_color: string } | null;
}

export interface SeasonOverSeasonEntry {
  year: number;
  name: string;
  totalPoints: number;
  correctPicks: number;
  totalPicks: number;
  winRate: number;
  upsetPicks: number;
  soleCorrectPicks: number;
}

// ─── Streaks ─────────────────────────────────────────────────

export interface PickStreaks {
  current_correct_streak: number;
  longest_correct_streak: number;
  current_wrong_streak: number;
  longest_wrong_streak: number;
  last_updated: string;
}

// ─── Commissioner ────────────────────────────────────────────

export type SeasonSettingsUpdate = Partial<SeasonSettings>;

// ─── ESPN ────────────────────────────────────────────────────

export interface ESPNGame {
  espnGameId: string;
  kickoffTime: string;
  homeTeam: string;
  homeAbbr: string;
  homeLogo: string;
  homeColor: string;
  homeAltColor: string;
  awayTeam: string;
  awayAbbr: string;
  awayLogo: string;
  awayColor: string;
  awayAltColor: string;
  spread: string | null;
  overUnder: number | null;
  favoriteAbbr: string | null;
  status: string;
  winner: string | null;
  period?: number;
  displayClock?: string;
  homeScore?: string;
  awayScore?: string;
  possession?: string;
  downDistance?: string;
  lastPlay?: string;
  isRedZone?: boolean;
}

// ─── NFL Seasons ─────────────────────────────────────────────

export interface NFLSeason {
  id: string;
  year: number;
  is_active: boolean;
  nfl_weeks: NFLWeek[];
}

export interface NFLWeek {
  id: string;
  week_number: number;
  week_type: string;
}
