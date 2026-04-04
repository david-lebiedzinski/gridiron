// supabase/functions/sync-live-scores/index.ts
// Deploy this as a Supabase Edge Function
// Set up a cron trigger in Supabase dashboard to run every 60 seconds on game days
//
// Supabase dashboard → Edge Functions → sync-live-scores → Cron triggers
// Cron expression: * * * * * (every minute)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // service role bypasses RLS
);

Deno.serve(async () => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Find games scheduled for today that aren't finished yet
    const { data: games } = await supabase
      .from('games')
      .select('id, espn_game_id, kickoff_time, winner_abbr, spread')
      .gte('kickoff_time', `${todayStr}T00:00:00Z`)
      .lte('kickoff_time', `${todayStr}T23:59:59Z`)
      .is('winner_abbr', null);

    if (!games?.length) {
      return new Response(JSON.stringify({ message: 'No active games today' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Single ESPN scoreboard request covers all of today's games
    const espnRes = await fetch(`${ESPN_BASE}/scoreboard`);
    if (!espnRes.ok) throw new Error(`ESPN API error: ${espnRes.status}`);
    const espnData = await espnRes.json();

    let synced = 0;
    let resolved = 0;

    for (const game of games) {
      // Only process games that have kicked off
      if (new Date(game.kickoff_time) > today) continue;

      const espnEvent = espnData.events?.find((e: any) => e.id === game.espn_game_id);
      if (!espnEvent) continue;

      const competition = espnEvent.competitions[0];
      const status = espnEvent.status.type.name;
      const home = competition.competitors.find((c: any) => c.homeAway === 'home');
      const away = competition.competitors.find((c: any) => c.homeAway === 'away');
      const situation = competition.situation ?? null;

      // Upsert live state
      await supabase
        .from('live_game_state')
        .upsert(
          {
            game_id: game.id,
            status,
            period: espnEvent.status.period ?? null,
            display_clock: espnEvent.status.displayClock ?? null,
            home_score: home?.score ?? null,
            away_score: away?.score ?? null,
            possession: situation?.possessionText ?? null,
            down_distance: situation?.downDistanceText ?? null,
            last_play: situation?.lastPlay?.text ?? null,
            is_red_zone: situation?.isRedZone ?? false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'game_id' }
        );

      synced++;

      // If game just finished, record the winner and trigger pick resolution
      if (status === 'STATUS_FINAL') {
        const winner = competition.competitors.find((c: any) => c.winner);
        const winnerAbbr = winner?.team.abbreviation ?? null;

        if (winnerAbbr) {
          await supabase
            .from('games')
            .update({ winner_abbr: winnerAbbr })
            .eq('id', game.id);

          // Call pick resolution via a database function
          // (resolveGamePicks logic runs server-side to avoid importing scoring.ts)
          await resolveGamePicks(game.id, winnerAbbr, game.spread);
          resolved++;
        }
      }
    }

    return new Response(
      JSON.stringify({ message: `Synced ${synced} games, resolved ${resolved}` }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('sync-live-scores error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ─── Pick Resolution ──────────────────────────────────────────
// Inline here to avoid cross-file imports in Edge Functions

async function resolveGamePicks(gameId: string, winnerAbbr: string, spread: string | null) {
  // Get week type for this game
  const { data: game } = await supabase
    .from('games')
    .select('weeks(week_type)')
    .eq('id', gameId)
    .single();

  const weekType = (game as any)?.weeks?.week_type ?? 'regular';
  const upset = isUpset(spread, winnerAbbr);

  // Get all picks for this game
  const { data: picks } = await supabase
    .from('picks')
    .select('id, user_id, league_season_id, picked_team_abbr')
    .eq('game_id', gameId)
    .is('is_correct', null); // only unresolved picks

  if (!picks?.length) return;

  // Group by league season
  const byLeagueSeason: Record<string, typeof picks> = {};
  for (const pick of picks) {
    if (!byLeagueSeason[pick.league_season_id]) byLeagueSeason[pick.league_season_id] = [];
    byLeagueSeason[pick.league_season_id].push(pick);
  }

  for (const [leagueSeasonId, leaguePicks] of Object.entries(byLeagueSeason)) {
    const correctPicks = leaguePicks.filter(p => p.picked_team_abbr === winnerAbbr);
    const isSoleCorrect = correctPicks.length === 1;

    const { data: settings } = await supabase
      .from('season_settings')
      .select('*')
      .eq('league_season_id', leagueSeasonId)
      .single();

    if (!settings) continue;

    for (const pick of leaguePicks) {
      const correct = pick.picked_team_abbr === winnerAbbr;
      const points = correct
        ? calculatePickPoints(correct, upset, correct && isSoleCorrect, weekType, settings)
        : 0;

      await supabase
        .from('picks')
        .update({
          is_correct: correct,
          is_upset: correct && upset,
          is_sole_correct: correct && isSoleCorrect,
          points_awarded: points,
        })
        .eq('id', pick.id);

      // Update streaks
      await updateStreaks(pick.user_id, leagueSeasonId, correct);
    }
  }
}

function isUpset(spread: string | null, winnerAbbr: string): boolean {
  if (!spread || spread === 'EVEN') return false;
  const match = spread.match(/^([A-Z]+)\s+[-][\d.]+$/);
  if (!match) return false;
  return winnerAbbr !== match[1];
}

function getRoundMultiplier(weekType: string, settings: any): number {
  switch (weekType) {
    case 'wildcard':     return settings.wildcard_multiplier;
    case 'divisional':   return settings.divisional_multiplier;
    case 'championship': return settings.championship_multiplier;
    case 'superbowl':    return settings.superbowl_multiplier;
    default:             return 1;
  }
}

function calculatePickPoints(
  isCorrect: boolean,
  isUpsetPick: boolean,
  isSoleCorrect: boolean,
  weekType: string,
  settings: any
): number {
  if (!isCorrect) return 0;
  const multiplier = getRoundMultiplier(weekType, settings);
  const base = isUpsetPick
    ? settings.base_correct_pts * settings.upset_multiplier
    : settings.base_correct_pts;
  const bonus = isSoleCorrect ? settings.sole_correct_bonus * multiplier : 0;
  return base * multiplier + bonus;
}

async function updateStreaks(userId: string, leagueSeasonId: string, isCorrect: boolean) {
  const { data: current } = await supabase
    .from('pick_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('league_season_id', leagueSeasonId)
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
      streaks.current_correct_streak
    );
  } else {
    streaks.current_wrong_streak++;
    streaks.current_correct_streak = 0;
    streaks.longest_wrong_streak = Math.max(
      streaks.longest_wrong_streak,
      streaks.current_wrong_streak
    );
  }

  await supabase
    .from('pick_streaks')
    .upsert(
      { user_id: userId, league_season_id: leagueSeasonId, ...streaks, last_updated: new Date().toISOString() },
      { onConflict: 'user_id,league_season_id' }
    );
}
