# Gridiron — Claude Code Handoff

## Project
Private NFL pick'em league web app for small friend groups (9-12 people).

## Tech Stack
- Vite + React + TypeScript
- Supabase (Postgres + Auth + Storage + Realtime)
- pnpm
- Tailwind CSS 4 (`@tailwindcss/vite`)
- react-router-dom 7
- recharts
- clsx
- Fonts: Bebas Neue, Oswald, DM Sans, JetBrains Mono (Google Fonts)

## Local Dev
```bash
# Supabase running at:
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<your local anon key>

# Studio:   http://127.0.0.1:54323
# Mailpit:  http://127.0.0.1:54324

# Generate types after schema is applied:
supabase gen types typescript --local > src/lib/database.types.ts
```

## Build Order
```
1. src/lib/supabase.ts           ← client init
2. src/lib/database.types.ts     ← generated from schema
3. src/context/AppContext.tsx    ← auth + active league state
4. src/App.tsx                   ← router + protected routes
5. src/screens/Auth.tsx          ← login + signup
6. src/screens/Onboarding.tsx    ← 4 step flow
7. src/components/AppShell.tsx   ← nav + profile drawer
8. src/screens/MobileCards.tsx   ← picks card view (default mobile)
9. src/screens/PicksGrid.tsx     ← desktop grid view (default desktop)
10. src/screens/Leaderboard.tsx
11. src/screens/Analytics.tsx
12. src/screens/Commissioner.tsx
13. src/screens/Admin.tsx
14. supabase/functions/sync-live-scores/index.ts ← ESPN edge fn
```

## Routing
```
Public:
  /login
  /signup
  /onboarding

Protected (inside AppShell):
  /picks             ← mobile cards (default on mobile)
  /grid              ← desktop grid (default on desktop)
  /leaderboard
  /analytics/:userId

Commissioner only:
  /commissioner
  /commissioner/members
  /commissioner/seasons
  /commissioner/sync

Super admin only:
  /admin
  /admin/nfl-seasons
  /admin/leagues
  /admin/sync
```

## Key Design Decisions

### State
- Active league stored in React context (not URL)
- League switches via profile drawer
- Profile is a drawer (slides from right), NOT a page
  - 320px on desktop, full width on mobile

### Pick Bar Visibility
- Pre-kickoff: hide other picks unless `picks_visible_before_kickoff = true`
- Show count of others who picked but not which team
- Post-kickoff (live/final): always show all picks

### Mobile vs Desktop
- `/picks` and `/grid` are separate routes, not responsive variants
- Default redirect: mobile → /picks, desktop → /grid (based on window.innerWidth)

### Colors (CSS custom properties in index.css)
```css
--bg:      #080a0f
--card:    #0d1117
--card2:   #111820
--border:  #1e2733
--accent:  #f5a623   ← primary brand amber
--me:      #6aa3ff   ← current user highlight
--text:    #e8eaf0
--muted:   #4a5568
--green:   #22c55e   ← correct picks
--red:     #ef4444   ← wrong picks
--silver:  #c8cdd6   ← prestige / trophy moments
```

### Fonts
```
Bebas Neue  → display headings, scores, points
Oswald      → UI labels, nav, caps text
DM Sans     → body text, descriptions
JetBrains Mono → data, times, records, codes
```

### Seasonal Themes
- Particle effects: Thanksgiving (leaves), Christmas (snow), Super Bowl (confetti),
  International (rain), Playoffs (silver sparks)
- Run on game days only: Thu/Sun/Mon
- Playoff + holiday weeks: always on
- User controls intensity: off/subtle/normal/full (stored in profiles.theme_intensity)
- Lives in AppShell — all pages inherit automatically

### Scoring System
```
Regular season correct:  1pt
Upset correct:           2pt (× round multiplier in playoffs)
Sole correct bonus:      +1pt
Weekly winner bonus:     +2pt regular season
Playoff multipliers:     WC=2, DIV=3, CONF=4, SB=5
```

### Auth
- Email + password only (no OAuth)
- Onboarding: username → photo (optional) → favorite team → invite code
- No invite code → waiting screen

## Schema Highlights
Key additions beyond a basic pick'em:
- `profiles.avatar_url` — Supabase Storage photo path
- `profiles.favorite_team` — e.g. 'PHI', 'KC' — drives avatar ring color
- `profiles.theme_intensity` — off/subtle/normal/full
- `season_settings.picks_visible_before_kickoff` — pick bar visibility rule
- `season_settings.theme_override` — commissioner can force a theme
- `live_game_state` — updated by Edge Function every 60s from ESPN API
- `pick_streaks` — tracked per user per season
- `superbowl_predictions` — tiebreaker table

## ESPN API
Unofficial ESPN API — no key required:
```
Scoreboard: https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?week={n}&seasontype=2
Game:       https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event={espn_game_id}
```
Edge Function `sync-live-scores` polls every 60s on game days.

## Deferred (do not build yet)
- Theme personalization (team color as accent, sepia light mode)
- Historical data import (Google Sheets 2019+)
- AI pick advisor ("how should I pick this game?")
- Emoji team marks

## Design Mockups
All screens are fully designed as HTML previews in `/previews/`:
- `mobile-cards-v2.html`         ← picks card view (USE THIS ONE)
- `single-page-app-responsive.html` ← desktop grid
- `leaderboard.html`
- `analytics.html`
- `commissioner.html`
- `auth-onboarding.html`
- `profile-drawer.html`
- `seasonal-themes.html`
- `theme-system.html`            ← color system exploration

## Lib Files (already written, may need updating)
- `src/lib/supabase.ts`
- `src/lib/auth.ts`
- `src/lib/leagues.ts`
- `src/lib/scoring.ts`
- `src/lib/analytics.ts`
- `src/lib/espn.ts`
- `src/lib/commissioner.ts`
- `src/lib/nflSeasons.ts`
- `src/context/AppContext.tsx`
- `supabase/functions/sync-live-scores/index.ts`
