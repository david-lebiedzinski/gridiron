#!/usr/bin/env node
// Generates seed_football_and_friends.sql from the CSV data.
// Run: node scripts/generate-seed.js > supabase/seed_football_and_friends.sql

const USERS = [
  { name: 'David',  col: 7,  uuid: 'c0000000-0000-0000-0000-000000000001', email: 'david@gridiron.test' },
  { name: 'Andrew', col: 8,  uuid: 'c0000000-0000-0000-0000-000000000002', email: 'andrew@gridiron.test' },
  { name: 'Daniel', col: 9,  uuid: 'c0000000-0000-0000-0000-000000000003', email: 'daniel@gridiron.test' },
  { name: 'Kyle',   col: 10, uuid: 'c0000000-0000-0000-0000-000000000004', email: 'kyle@gridiron.test' },
  { name: 'Scott',  col: 11, uuid: 'c0000000-0000-0000-0000-000000000005', email: 'scott@gridiron.test' },
  { name: 'Catie',  col: 12, uuid: 'c0000000-0000-0000-0000-000000000006', email: 'catie@gridiron.test' },
  { name: 'Caleb',  col: 13, uuid: 'c0000000-0000-0000-0000-000000000007', email: 'caleb@gridiron.test' },
  { name: 'Ethan',  col: 14, uuid: 'c0000000-0000-0000-0000-000000000008', email: 'ethan@gridiron.test' },
  { name: 'Phil',   col: 15, uuid: 'c0000000-0000-0000-0000-000000000009', email: 'phil@gridiron.test' },
];

const WEEK_MAP = {
  'WC': { num: 19, type: 'wildcard' },
  'DIV': { num: 20, type: 'divisional' },
  'CONF': { num: 21, type: 'championship' },
  'SB': { num: 22, type: 'superbowl' },
};

const TEAM_NAMES = {
  ARI: 'Arizona Cardinals', ATL: 'Atlanta Falcons', BAL: 'Baltimore Ravens', BUF: 'Buffalo Bills',
  CAR: 'Carolina Panthers', CHI: 'Chicago Bears', CIN: 'Cincinnati Bengals', CLE: 'Cleveland Browns',
  DAL: 'Dallas Cowboys', DEN: 'Denver Broncos', DET: 'Detroit Lions', GB: 'Green Bay Packers',
  HOU: 'Houston Texans', IND: 'Indianapolis Colts', JAX: 'Jacksonville Jaguars', KC: 'Kansas City Chiefs',
  LAC: 'Los Angeles Chargers', LAR: 'Los Angeles Rams', LV: 'Las Vegas Raiders', MIA: 'Miami Dolphins',
  MIN: 'Minnesota Vikings', NE: 'New England Patriots', NO: 'New Orleans Saints', NYG: 'New York Giants',
  NYJ: 'New York Jets', PHI: 'Philadelphia Eagles', PIT: 'Pittsburgh Steelers', SEA: 'Seattle Seahawks',
  SF: 'San Francisco 49ers', TB: 'Tampa Bay Buccaneers', TEN: 'Tennessee Titans', WSH: 'Washington Commanders',
};

// Week 1 starts 2024-09-05 (Thursday)
const WEEK1_START = new Date('2024-09-05T00:00:00-04:00');

function weekStartDate(weekNum) {
  if (weekNum <= 18) {
    const d = new Date(WEEK1_START);
    d.setDate(d.getDate() + (weekNum - 1) * 7);
    return d;
  }
  // Playoffs
  const playoffStarts = {
    19: new Date('2025-01-11T00:00:00-05:00'),
    20: new Date('2025-01-18T00:00:00-05:00'),
    21: new Date('2025-01-26T00:00:00-05:00'),
    22: new Date('2025-02-09T00:00:00-05:00'),
  };
  return playoffStarts[weekNum] || WEEK1_START;
}

function parseKickoffTime(timeStr, weekNum) {
  // timeStr like "Thu, 8:20 PM" or "Sun, 1:00 PM"
  const dayMap = { 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0, 'Mon': 1 };
  const parts = timeStr.trim().split(', ');
  const dayAbbr = parts[0];
  const timePart = parts[1]; // "8:20 PM"

  const baseDate = weekStartDate(weekNum);
  const targetDay = dayMap[dayAbbr];

  // Find the date of targetDay in or after baseDate's week
  const d = new Date(baseDate);
  const baseDay = d.getDay();
  let diff = targetDay - baseDay;
  if (diff < 0) { diff += 7; }
  d.setDate(d.getDate() + diff);

  // Parse time
  const timeMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const ampm = timeMatch[3];
    if (ampm === 'PM' && hours !== 12) { hours += 12; }
    if (ampm === 'AM' && hours === 12) { hours = 0; }
    d.setHours(hours, minutes, 0, 0);
  }

  return d.toISOString();
}

function weekId(weekNum) {
  const padded = String(weekNum).padStart(2, '0');
  return `e0000000-0000-0000-0000-0000000000${padded}`;
}

// Parse CSV
const fs = require('fs');
const csvPath = process.argv[2] || 'Football & Friends - 2025.csv';
const csvData = fs.readFileSync(csvPath, 'utf-8');
const lines = csvData.split('\n').filter(l => l.trim());

// Skip header row
const games = [];
for (let i = 1; i < lines.length; i++) {
  // Parse CSV respecting quoted fields
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (const ch of lines[i]) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { cols.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  cols.push(current.trim());

  const weekRaw = cols[0];
  if (!weekRaw) { continue; }

  const weekInfo = WEEK_MAP[weekRaw] || { num: parseInt(weekRaw), type: 'regular' };
  if (isNaN(weekInfo.num)) { continue; }

  const timeStr = cols[1];
  const awayAbbr = cols[2];
  const awayScore = parseInt(cols[3]);
  // cols[4] = "Final"
  const homeScore = parseInt(cols[5]);
  const homeAbbr = cols[6];

  let winner;
  if (awayScore > homeScore) { winner = awayAbbr; }
  else if (homeScore > awayScore) { winner = homeAbbr; }
  else { winner = homeAbbr; } // tie goes to home (GB@DAL W4 40-40)

  const picks = {};
  for (const user of USERS) {
    const pick = cols[user.col];
    if (pick && pick.trim()) {
      picks[user.uuid] = pick.trim();
    }
  }

  games.push({
    weekNum: weekInfo.num,
    weekRaw,
    timeStr,
    awayAbbr,
    awayScore,
    homeAbbr,
    homeScore,
    winner,
    picks,
  });
}

// Generate SQL
const out = [];
out.push(`-- ============================================================`);
out.push(`-- Seed: "Football and Friends" league — 2025 NFL Season`);
out.push(`-- Generated by scripts/generate-seed.js`);
out.push(`-- ${games.length} games, ${USERS.length} users`);
out.push(`-- Run: psql $DATABASE_URL -f supabase/seed_football_and_friends.sql`);
out.push(`-- ============================================================`);
out.push(``);
out.push(`-- ── 1. Clean slate ─────────────────────────────────────────────`);
out.push(``);
out.push(`TRUNCATE public.picks CASCADE;`);
out.push(`TRUNCATE public.live_game_state CASCADE;`);
out.push(`TRUNCATE public.pick_streaks CASCADE;`);
out.push(`TRUNCATE public.superbowl_predictions CASCADE;`);
out.push(`TRUNCATE public.games CASCADE;`);
out.push(`TRUNCATE public.nfl_weeks CASCADE;`);
out.push(`TRUNCATE public.season_settings CASCADE;`);
out.push(`TRUNCATE public.league_seasons CASCADE;`);
out.push(`TRUNCATE public.league_members CASCADE;`);
out.push(`TRUNCATE public.leagues CASCADE;`);
out.push(`TRUNCATE public.nfl_seasons CASCADE;`);
out.push(`TRUNCATE public.profiles CASCADE;`);
out.push(`DELETE FROM auth.users;`);
out.push(``);

out.push(`-- ── 2. Auth users ────────────────────────────────────────────`);
out.push(``);
out.push(`INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at) VALUES`);
const userRows = USERS.map(u =>
  `  ('${u.uuid}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '${u.email}', crypt('password123', gen_salt('bf')), now(), '{"username":"${u.name}"}'::jsonb, now(), now())`
);
out.push(userRows.join(',\n') + ';');
out.push(``);
out.push(`UPDATE public.profiles SET is_super_admin = true WHERE id = '${USERS[0].uuid}';`);
out.push(``);

out.push(`-- ── 3. NFL Season + Weeks ────────────────────────────────────`);
out.push(``);
out.push(`INSERT INTO public.nfl_seasons (id, year, is_active) VALUES ('d0000000-0000-0000-0000-000000000001', 2025, true);`);
out.push(``);
out.push(`INSERT INTO public.nfl_weeks (id, season_id, week_number, week_type) VALUES`);
const weekRows = [];
for (let w = 1; w <= 18; w++) {
  weekRows.push(`  ('${weekId(w)}', 'd0000000-0000-0000-0000-000000000001', ${w}, 'regular')`);
}
weekRows.push(`  ('${weekId(19)}', 'd0000000-0000-0000-0000-000000000001', 19, 'wildcard')`);
weekRows.push(`  ('${weekId(20)}', 'd0000000-0000-0000-0000-000000000001', 20, 'divisional')`);
weekRows.push(`  ('${weekId(21)}', 'd0000000-0000-0000-0000-000000000001', 21, 'championship')`);
weekRows.push(`  ('${weekId(22)}', 'd0000000-0000-0000-0000-000000000001', 22, 'superbowl')`);
out.push(weekRows.join(',\n') + ';');
out.push(``);

out.push(`-- ── 4. League + Season ───────────────────────────────────────`);
out.push(``);
out.push(`INSERT INTO public.leagues (id, name, commissioner_id) VALUES ('f0000000-0000-0000-0000-000000000001', 'Football and Friends', '${USERS[0].uuid}');`);
out.push(``);
out.push(`INSERT INTO public.league_members (league_id, user_id, role) VALUES`);
const memberRows = USERS.map((u, i) =>
  `  ('f0000000-0000-0000-0000-000000000001', '${u.uuid}', '${i === 0 ? 'commissioner' : 'member'}')`
);
out.push(memberRows.join(',\n') + ';');
out.push(``);
out.push(`INSERT INTO public.league_seasons (id, league_id, nfl_season_id, name, is_active, locked)`);
out.push(`VALUES ('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '2025 Season', true, true);`);
out.push(``);
out.push(`INSERT INTO public.season_settings (league_season_id) VALUES ('f1000000-0000-0000-0000-000000000001');`);
out.push(``);

out.push(`-- ── 5. Games + Scores + Picks ────────────────────────────────`);
out.push(``);
out.push(`DO $$`);
out.push(`DECLARE`);
out.push(`  ls_id uuid := 'f1000000-0000-0000-0000-000000000001';`);
out.push(`  g_id uuid;`);
out.push(`BEGIN`);
out.push(``);

let currentWeek = null;
let gameIdx = 0;
for (const game of games) {
  if (game.weekNum !== currentWeek) {
    currentWeek = game.weekNum;
    const label = game.weekNum <= 18 ? `WEEK ${game.weekNum}` : game.weekRaw;
    out.push(`-- ── ${label} ──`);
  }

  gameIdx++;
  const espnId = `2025_${game.weekRaw}_${game.awayAbbr}_${game.homeAbbr}`;
  const kickoff = parseKickoffTime(game.timeStr, game.weekNum);
  const awayName = TEAM_NAMES[game.awayAbbr] || game.awayAbbr;
  const homeName = TEAM_NAMES[game.homeAbbr] || game.homeAbbr;

  out.push(`INSERT INTO public.games (id, week_id, away_abbr, away_team, home_abbr, home_team, kickoff_time, winner_abbr, espn_game_id)`);
  out.push(`VALUES (gen_random_uuid(), '${weekId(game.weekNum)}', '${game.awayAbbr}', '${awayName}', '${game.homeAbbr}', '${homeName}', '${kickoff}', '${game.winner}', '${espnId}')`);
  out.push(`RETURNING id INTO g_id;`);
  out.push(`INSERT INTO public.live_game_state (game_id, status, home_score, away_score) VALUES (g_id, 'STATUS_FINAL', '${game.homeScore}', '${game.awayScore}');`);

  // Picks
  const pickEntries = Object.entries(game.picks);
  if (pickEntries.length > 0) {
    out.push(`INSERT INTO public.picks (user_id, game_id, league_season_id, picked_team_abbr, is_correct) VALUES`);
    const pickRows = pickEntries.map(([userId, pick]) => {
      const correct = pick === game.winner;
      return `  ('${userId}', g_id, ls_id, '${pick}', ${correct})`;
    });
    out.push(pickRows.join(',\n') + ';');
  }

  out.push(``);
}

out.push(`END $$;`);

console.log(out.join('\n'));
