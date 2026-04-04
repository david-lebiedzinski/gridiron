import { supabase } from "./supabase";
import type {
  WeekType,
  TeamPickRecord,
  PickingRates,
  TimeSlotStat,
  PickStreaks,
  WeeklyPatterns,
  WeekStat,
  HeadToHeadRecord,
  HeadToHeadEntry,
  SeasonOverSeasonEntry,
} from "../types";

// ─── Team Picking Record ──────────────────────────────────────

export async function getTeamPickingRecord(
  userId: string,
  leagueSeasonId: string,
): Promise<TeamPickRecord[]> {
  const { data } = await supabase
    .from("picks")
    .select("picked_team_abbr, is_correct, is_upset, is_sole_correct")
    .eq("user_id", userId)
    .eq("league_season_id", leagueSeasonId)
    .not("is_correct", "is", null);

  const byTeam: Record<
    string,
    { picked: number; correct: number; upsets: number; soleCorrect: number }
  > = {};

  for (const pick of data ?? []) {
    const team = pick.picked_team_abbr;
    if (!byTeam[team])
      byTeam[team] = { picked: 0, correct: 0, upsets: 0, soleCorrect: 0 };
    byTeam[team].picked++;
    if (pick.is_correct) byTeam[team].correct++;
    if (pick.is_upset) byTeam[team].upsets++;
    if (pick.is_sole_correct) byTeam[team].soleCorrect++;
  }

  return Object.entries(byTeam)
    .map(([team, stats]) => ({
      team,
      picked: stats.picked,
      correct: stats.correct,
      winRate: Math.round((stats.correct / stats.picked) * 100),
      upsets: stats.upsets,
      soleCorrect: stats.soleCorrect,
    }))
    .sort((a, b) => b.picked - a.picked);
}

// ─── Overall Picking Rates ────────────────────────────────────

export async function getPickingRates(
  userId: string,
  leagueSeasonId: string,
): Promise<PickingRates | null> {
  const { data } = await supabase
    .from("picks")
    .select("is_correct, is_upset, is_sole_correct")
    .eq("user_id", userId)
    .eq("league_season_id", leagueSeasonId)
    .not("is_correct", "is", null);

  const total = data?.length ?? 0;
  if (total === 0) return null;

  const correct = data?.filter((p) => p.is_correct).length ?? 0;
  const upsets = data?.filter((p) => p.is_upset).length ?? 0;
  const soleCorrect = data?.filter((p) => p.is_sole_correct).length ?? 0;
  const upsetAttempts = data?.filter((p) => p.is_upset !== null).length ?? 1;

  return {
    total,
    correct,
    correctRate: Math.round((correct / total) * 100),
    upsetPickRate: Math.round((upsets / total) * 100),
    upsetSuccessRate: Math.round((upsets / upsetAttempts) * 100),
    contrarianRate: correct > 0 ? Math.round((soleCorrect / correct) * 100) : 0,
  };
}

// ─── Time Slot Performance ────────────────────────────────────

interface PickWithGame {
  is_correct: boolean;
  points_awarded: number | null;
  games: {
    kickoff_time: string;
    weeks: { week_type: string };
  } | null;
}

export async function getTimeSlotPerformance(
  userId: string,
  leagueSeasonId: string,
): Promise<TimeSlotStat[]> {
  const { data } = await supabase
    .from("picks")
    .select(
      `
      is_correct,
      points_awarded,
      games (
        kickoff_time,
        weeks ( week_type )
      )
    `,
    )
    .eq("user_id", userId)
    .eq("league_season_id", leagueSeasonId)
    .not("is_correct", "is", null);

  const slots: Record<
    string,
    { label: string; picked: number; correct: number; points: number }
  > = {
    thursday: {
      label: "Thursday Night",
      picked: 0,
      correct: 0,
      points: 0,
    },
    sunday_early: {
      label: "Sunday Early (1pm)",
      picked: 0,
      correct: 0,
      points: 0,
    },
    sunday_430: {
      label: "Sunday Afternoon (4:30)",
      picked: 0,
      correct: 0,
      points: 0,
    },
    sunday_night: {
      label: "Sunday Night Football",
      picked: 0,
      correct: 0,
      points: 0,
    },
    monday_night: {
      label: "Monday Night Football",
      picked: 0,
      correct: 0,
      points: 0,
    },
    playoffs: { label: "Playoffs", picked: 0, correct: 0, points: 0 },
  };

  for (const pick of (data ?? []) as unknown as PickWithGame[]) {
    if (!pick.games) continue;
    const kickoff = new Date(pick.games.kickoff_time);
    const weekType = pick.games.weeks?.week_type as WeekType;
    const dayUTC = kickoff.getUTCDay();
    const hourET = kickoff.getUTCHours() - 5;

    let slot: string;
    if (weekType !== "regular") {
      slot = "playoffs";
    } else if (dayUTC === 4) {
      slot = "thursday";
    } else if (dayUTC === 1) {
      slot = "monday_night";
    } else if (hourET >= 20) {
      slot = "sunday_night";
    } else if (hourET >= 16) {
      slot = "sunday_430";
    } else {
      slot = "sunday_early";
    }

    slots[slot].picked++;
    if (pick.is_correct) slots[slot].correct++;
    slots[slot].points += pick.points_awarded ?? 0;
  }

  return Object.entries(slots).map(([key, stats]) => ({
    slot: key,
    label: stats.label,
    picked: stats.picked,
    correct: stats.correct,
    winRate:
      stats.picked > 0 ? Math.round((stats.correct / stats.picked) * 100) : 0,
    points: stats.points,
  }));
}

// ─── Streak Tracking ──────────────────────────────────────────

export async function updateStreaks(
  userId: string,
  leagueSeasonId: string,
  isCorrect: boolean,
): Promise<void> {
  const { data: current } = await supabase
    .from("pick_streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("league_season_id", leagueSeasonId)
    .single();

  const streaks = {
    current_correct_streak: current?.current_correct_streak ?? 0,
    longest_correct_streak: current?.longest_correct_streak ?? 0,
    current_wrong_streak: current?.current_wrong_streak ?? 0,
    longest_wrong_streak: current?.longest_wrong_streak ?? 0,
  };

  if (isCorrect) {
    streaks.current_correct_streak++;
    streaks.current_wrong_streak = 0;
    streaks.longest_correct_streak = Math.max(
      streaks.longest_correct_streak,
      streaks.current_correct_streak,
    );
  } else {
    streaks.current_wrong_streak++;
    streaks.current_correct_streak = 0;
    streaks.longest_wrong_streak = Math.max(
      streaks.longest_wrong_streak,
      streaks.current_wrong_streak,
    );
  }

  await supabase.from("pick_streaks").upsert(
    {
      user_id: userId,
      league_season_id: leagueSeasonId,
      ...streaks,
      last_updated: new Date().toISOString(),
    },
    { onConflict: "user_id,league_season_id" },
  );
}

export async function getStreaks(
  userId: string,
  leagueSeasonId: string,
): Promise<PickStreaks | null> {
  const { data } = await supabase
    .from("pick_streaks")
    .select("*")
    .eq("user_id", userId)
    .eq("league_season_id", leagueSeasonId)
    .single();

  return data as PickStreaks | null;
}

// ─── Weekly Patterns ──────────────────────────────────────────

interface PickWithWeek {
  points_awarded: number | null;
  is_correct: boolean;
  games: { weeks: { week_number: number; week_type: string } } | null;
}

export async function getWeeklyPatterns(
  userId: string,
  leagueSeasonId: string,
): Promise<WeeklyPatterns | null> {
  const { data } = await supabase
    .from("picks")
    .select(
      `
      points_awarded,
      is_correct,
      games (
        weeks ( week_number, week_type )
      )
    `,
    )
    .eq("user_id", userId)
    .eq("league_season_id", leagueSeasonId)
    .not("points_awarded", "is", null);

  const byWeek: Record<
    number,
    { points: number; correct: number; total: number }
  > = {};

  for (const pick of (data ?? []) as unknown as PickWithWeek[]) {
    const week = pick.games?.weeks?.week_number ?? 0;
    if (!byWeek[week]) byWeek[week] = { points: 0, correct: 0, total: 0 };
    byWeek[week].points += pick.points_awarded ?? 0;
    byWeek[week].total++;
    if (pick.is_correct) byWeek[week].correct++;
  }

  const weeks: WeekStat[] = Object.entries(byWeek).map(([week, stats]) => ({
    week: parseInt(week),
    points: stats.points,
    correct: stats.correct,
    total: stats.total,
    winRate: Math.round((stats.correct / stats.total) * 100),
  }));

  if (!weeks.length) return null;

  const pointsArr = weeks.map((w) => w.points);

  return {
    weeks,
    bestWeek: weeks.reduce((a, b) => (a.points > b.points ? a : b)),
    worstWeek: weeks.reduce((a, b) => (a.points < b.points ? a : b)),
    averagePointsPerWeek: Math.round(
      pointsArr.reduce((a, b) => a + b, 0) / pointsArr.length,
    ),
  };
}

// ─── Head to Head ─────────────────────────────────────────────

export async function getHeadToHead(
  userId: string,
  opponentId: string,
  leagueSeasonId: string,
): Promise<HeadToHeadRecord> {
  const [{ data: myPicks }, { data: theirPicks }] = await Promise.all([
    supabase
      .from("picks")
      .select("game_id, points_awarded")
      .eq("user_id", userId)
      .eq("league_season_id", leagueSeasonId)
      .not("points_awarded", "is", null),
    supabase
      .from("picks")
      .select("game_id, points_awarded")
      .eq("user_id", opponentId)
      .eq("league_season_id", leagueSeasonId)
      .not("points_awarded", "is", null),
  ]);

  const theirByGame = Object.fromEntries(
    (theirPicks ?? []).map((p) => [p.game_id, p.points_awarded ?? 0]),
  );

  let wins = 0,
    losses = 0,
    ties = 0;

  for (const myPick of myPicks ?? []) {
    const theirPts = theirByGame[myPick.game_id];
    if (theirPts === undefined) continue;

    const myPts = myPick.points_awarded ?? 0;
    if (myPts > theirPts) wins++;
    else if (theirPts > myPts) losses++;
    else ties++;
  }

  return { wins, losses, ties, record: `${wins}-${losses}-${ties}` };
}

export async function getAllHeadToHead(
  userId: string,
  leagueId: string,
  leagueSeasonId: string,
): Promise<HeadToHeadEntry[]> {
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, profiles(username, avatar_color)")
    .eq("league_id", leagueId)
    .neq("user_id", userId);

  const results = await Promise.all(
    (members ?? []).map(async (member) => {
      const h2h = await getHeadToHead(userId, member.user_id, leagueSeasonId);
      const profiles = member.profiles as {
        username: string;
        avatar_color: string;
      } | null;
      return { ...h2h, opponent: profiles };
    }),
  );

  return results.sort((a, b) => b.wins - a.wins);
}

// ─── Season Over Season ───────────────────────────────────────

interface SeasonWithPicks {
  name: string;
  nfl_seasons: { year: number } | null;
  picks: {
    points_awarded: number | null;
    is_correct: boolean;
    is_upset: boolean;
    is_sole_correct: boolean;
    user_id: string;
  }[];
}

export async function getSeasonOverSeason(
  userId: string,
  leagueId: string,
): Promise<SeasonOverSeasonEntry[]> {
  const { data } = await supabase
    .from("league_seasons")
    .select(
      `
      id,
      name,
      nfl_seasons ( year ),
      picks!inner (
        points_awarded,
        is_correct,
        is_upset,
        is_sole_correct,
        user_id
      )
    `,
    )
    .eq("league_id", leagueId)
    .eq("picks.user_id", userId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as unknown as SeasonWithPicks[]).map((season) => {
    const picks = season.picks.filter((p) => p.points_awarded !== null);
    const total = picks.reduce((sum, p) => sum + (p.points_awarded ?? 0), 0);
    const correct = picks.filter((p) => p.is_correct).length;

    return {
      year: season.nfl_seasons?.year ?? 0,
      name: season.name,
      totalPoints: total,
      correctPicks: correct,
      totalPicks: picks.length,
      winRate:
        picks.length > 0 ? Math.round((correct / picks.length) * 100) : 0,
      upsetPicks: picks.filter((p) => p.is_upset).length,
      soleCorrectPicks: picks.filter((p) => p.is_sole_correct).length,
    };
  });
}
