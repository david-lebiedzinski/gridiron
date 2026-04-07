-- ─── Season ──────────────────────────────────────────────────

create table public.season (
  id              uuid primary key default gen_random_uuid(),
  year            int not null unique,
  start_date      date not null,
  end_date        date not null,
  last_synced_at  timestamptz
);

comment on table public.season is 'NFL season — one row per year, mirrored from ESPN';

-- ─── Team ────────────────────────────────────────────────────

create table public.team (
  id            uuid primary key default gen_random_uuid(),
  espn_id       text not null unique,
  abbr          text not null unique,
  location      text not null,
  name          text not null,
  display_name  text not null,
  color         text,
  alternate_color text
);

comment on table public.team is 'NFL team — mirrored from ESPN';
comment on column public.team.espn_id is 'ESPN team ID (stable across seasons)';
comment on column public.team.location is 'City / region (e.g. "New England")';
comment on column public.team.name is 'Team name (e.g. "Patriots")';
comment on column public.team.display_name is 'Full display name (e.g. "New England Patriots")';

-- ─── Week ────────────────────────────────────────────────────

create table public.week (
  id                    uuid primary key default gen_random_uuid(),
  season_id             uuid not null references public.season(id) on delete cascade,
  phase                 text not null check (phase in ('pre', 'reg', 'post')),
  espn_value            int not null,
  label                 text not null,
  detail                text,
  start_date            date not null,
  end_date              date not null,
  counts_for_standings  boolean not null default true,
  unique (season_id, phase, espn_value)
);

comment on table public.week is 'A week within a season — mirrored from ESPN calendar';
comment on column public.week.phase is 'pre / reg / post';
comment on column public.week.espn_value is 'Week number within its phase';
comment on column public.week.label is 'e.g. "Week 1", "Wild Card", "Pro Bowl"';
comment on column public.week.detail is 'e.g. "Sep 4-9"';
comment on column public.week.counts_for_standings is 'False for preseason and Pro Bowl';

-- ─── Game ────────────────────────────────────────────────────

create table public.game (
  id                uuid primary key default gen_random_uuid(),
  week_id           uuid not null references public.week(id) on delete cascade,
  espn_event_id     text not null unique,
  home_team_id      uuid not null references public.team(id),
  away_team_id      uuid not null references public.team(id),
  home_team_record  text,
  away_team_record  text,
  headline          text,
  kickoff_time      timestamptz not null,
  status            text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'halftime', 'final')),
  home_score        int default 0,
  away_score        int default 0,
  spread            numeric,
  period            int,
  display_clock     text,
  possession_id     uuid references public.team(id),
  down_distance     text,
  last_play         text,
  is_red_zone       boolean default false,
  winner_id         uuid references public.team(id)
);

comment on table public.game is 'NFL game — mirrored from ESPN';
comment on column public.game.home_team_record is 'Team record snapshot at sync time, e.g. "14-3"';
comment on column public.game.headline is 'Special game label like "Super Bowl LX" or international game name';

-- ─── League ──────────────────────────────────────────────────

create table public.league (
  id                           uuid primary key default gen_random_uuid(),
  name                         text not null,
  invite_code                  text not null unique default substr(md5(random()::text), 1, 8),
  base_correct_pts             int not null default 1,
  upset_multiplier             numeric not null default 1,
  sole_correct_bonus           int not null default 1,
  wildcard_multiplier          numeric not null default 2,
  divisional_multiplier        numeric not null default 3,
  championship_multiplier      numeric not null default 4,
  superbowl_multiplier         numeric not null default 5,
  weekly_bonus_regular         int not null default 1,
  weekly_bonus_scales          boolean not null default false,
  picks_visible_before_kickoff boolean not null default false,
  stats_public_default         boolean not null default true
);

comment on table public.league is 'A pick-em league — settings live directly on the league';

-- ─── Profile ─────────────────────────────────────────────────

create table public.profile (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text not null,
  avatar           text,
  favorite_team_id uuid references public.team(id),
  is_admin         boolean not null default false,
  theme_intensity  text not null default 'normal' check (theme_intensity in ('off', 'subtle', 'normal', 'full'))
);

comment on table public.profile is 'User profile — extends auth.users';

-- ─── League Members ──────────────────────────────────────────

create table public.league_member (
  league_id uuid not null references public.league(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  primary key (league_id, user_id)
);

-- ─── Pick ────────────────────────────────────────────────────

create table public.pick (
  league_id       uuid not null references public.league(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  game_id         uuid not null references public.game(id) on delete cascade,
  team_id         uuid not null references public.team(id),
  is_correct      boolean,
  is_sole_correct boolean,
  points          int,
  primary key (league_id, user_id, game_id)
);

-- ─── Week Bonus ──────────────────────────────────────────────

create table public.week_bonus (
  league_id uuid not null references public.league(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  week_id   uuid not null references public.week(id) on delete cascade,
  points    int not null,
  primary key (league_id, user_id, week_id)
);

-- ─── Indexes ─────────────────────────────────────────────────

create index idx_week_season on public.week(season_id);
create index idx_week_phase on public.week(season_id, phase);
create index idx_game_week on public.game(week_id);
create index idx_game_kickoff on public.game(kickoff_time);

-- ─── RLS ─────────────────────────────────────────────────────

alter table public.team enable row level security;
alter table public.season enable row level security;
alter table public.week enable row level security;
alter table public.game enable row level security;
alter table public.profile enable row level security;
alter table public.league enable row level security;
alter table public.league_member enable row level security;
alter table public.pick enable row level security;
alter table public.week_bonus enable row level security;

-- Read access for authenticated users
create policy "Authenticated users can view teams"
  on public.team for select using (auth.role() = 'authenticated');

create policy "Authenticated users can view seasons"
  on public.season for select using (auth.role() = 'authenticated');

create policy "Authenticated users can view weeks"
  on public.week for select using (auth.role() = 'authenticated');

create policy "Authenticated users can view games"
  on public.game for select using (auth.role() = 'authenticated');

create policy "Authenticated users can view profiles"
  on public.profile for select using (auth.role() = 'authenticated');

create policy "Users can update their own profile"
  on public.profile for update using (id = auth.uid());

create policy "Authenticated users can view leagues"
  on public.league for select using (auth.role() = 'authenticated');

create policy "Members can view their league memberships"
  on public.league_member for select using (auth.role() = 'authenticated');

create policy "Authenticated users can view picks"
  on public.pick for select using (auth.role() = 'authenticated');

create policy "Authenticated users can view week bonuses"
  on public.week_bonus for select using (auth.role() = 'authenticated');

-- Admin write access
create policy "Admins can manage teams"
  on public.team for all using (
    exists (select 1 from public.profile where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage seasons"
  on public.season for all using (
    exists (select 1 from public.profile where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage weeks"
  on public.week for all using (
    exists (select 1 from public.profile where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage games"
  on public.game for all using (
    exists (select 1 from public.profile where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage leagues"
  on public.league for all using (
    exists (select 1 from public.profile where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage league members"
  on public.league_member for all using (
    exists (select 1 from public.profile where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage picks"
  on public.pick for all using (
    exists (select 1 from public.profile where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage week bonuses"
  on public.week_bonus for all using (
    exists (select 1 from public.profile where id = auth.uid() and is_admin = true)
  );

-- Users manage their own picks + memberships
create policy "Users can manage their own picks"
  on public.pick for all using (user_id = auth.uid());

create policy "Users can join leagues"
  on public.league_member for insert with check (user_id = auth.uid());

create policy "Users can leave leagues"
  on public.league_member for delete using (user_id = auth.uid());

-- ─── Realtime ────────────────────────────────────────────────

alter publication supabase_realtime add table public.game;
