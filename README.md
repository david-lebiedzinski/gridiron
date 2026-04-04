# NFL Pick'em — Backend

## Stack
- **Frontend** — React + TypeScript, deployed on Vercel
- **Backend/DB** — Supabase (Postgres + Auth + Realtime)
- **NFL Data** — ESPN unofficial API
- **Live Scores** — Supabase Edge Function (cron, every 60s)

---

## Setup

### 1. Supabase Project
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. After signing up in the app, find your user ID in **Authentication → Users**
4. Run this in the SQL editor to make yourself super admin:
   ```sql
   update public.profiles set is_super_admin = true where id = 'your-uuid';
   ```

### 2. Environment Variables
Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Find these in Supabase dashboard → **Settings → API**.

### 3. Deploy Edge Function
```bash
npx supabase functions deploy sync-live-scores
```
Then in Supabase dashboard → **Edge Functions → sync-live-scores → Cron triggers**:
- Add cron: `* * * * *` (every minute)
- Only needs to run on game days — you can disable during off-season

### 4. Vercel Deployment
1. Push to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard (same as `.env`)
4. Every push to main auto-deploys

---

## File Structure

```
src/
  lib/
    supabase.ts       — Supabase client
    auth.ts           — Sign up, sign in, sign out, profile
    leagues.ts        — Join league, get user leagues, visibility
    commissioner.ts   — Create league, manage members, seasons
    nflSeasons.ts     — Global NFL season + week management (super admin)
    espn.ts           — ESPN API fetch + parse
    scoring.ts        — Points calculation, leaderboard, tiebreakers
    analytics.ts      — All analytics queries + streak tracking
  context/
    AppContext.tsx     — Auth state, active league, active season

supabase/
  migrations/
    001_initial_schema.sql  — Full DB schema + RLS
  functions/
    sync-live-scores/
      index.ts              — Edge Function: ESPN poll + pick resolution
```

---

## Data Model

```
Global (you manage)          Per-League                    Per-Player
───────────────────          ──────────                    ──────────
nfl_seasons                  leagues                       profiles
nfl_weeks                    league_members                picks
games                        league_seasons                pick_streaks
live_game_state              season_settings               superbowl_predictions
```

---

## Scoring

| Scenario       | Regular | Wild Card | Divisional | Championship | Super Bowl |
|----------------|---------|-----------|------------|--------------|------------|
| Correct pick   | 1pt     | 2pts      | 3pts       | 4pts         | 5pts       |
| Correct upset  | 2pts    | 4pts      | 6pts       | 8pts         | 10pts      |
| Sole correct   | +1pt    | +2pts     | +3pts      | +4pts        | +5pts      |

Weekly winner bonus: 2pts regular, scales with playoff round, split on ties.
All values configurable per league per season.

**Tiebreaker chain:**
1. Super Bowl score prediction (closest to actual)
2. Most playoff points
3. Shared rank

---

## Open Questions
- [ ] Projected leaderboard display (deferred)
- [ ] Analytics visibility UI for players + commissioners
- [ ] Frontend UI components (not started)
