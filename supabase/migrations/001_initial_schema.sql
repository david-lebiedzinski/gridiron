-- ─────────────────────────────────────────────────────────────
-- GRIDIRON — NFL PICK'EM
-- Initial Schema
-- ─────────────────────────────────────────────────────────────


-- ─── ENUMS ───────────────────────────────────────────────────

create type public.week_type as enum (
  'regular', 'wildcard', 'divisional', 'championship', 'superbowl'
);

create type public.member_role as enum (
  'commissioner', 'member'
);

create type public.stats_visibility as enum (
  'league_default', 'public', 'private'
);

create type public.theme_intensity as enum (
  'off', 'subtle', 'normal', 'full'
);


-- ─── PROFILES ────────────────────────────────────────────────

create table public.profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  username         text unique not null,
  avatar_color     text not null default '#f5a623',
  avatar_url       text default null,
  favorite_team    text default null,
  theme_intensity  public.theme_intensity not null default 'normal',
  is_super_admin   boolean not null default false,
  created_at       timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── LEAGUES ─────────────────────────────────────────────────

create table public.leagues (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  invite_code     text unique not null default upper(substring(gen_random_uuid()::text, 1, 8)),
  commissioner_id uuid references public.profiles(id) not null,
  created_at      timestamptz not null default now()
);

create table public.league_members (
  league_id        uuid references public.leagues(id) on delete cascade,
  user_id          uuid references public.profiles(id) on delete cascade,
  role             public.member_role not null default 'member',
  stats_visibility public.stats_visibility not null default 'league_default',
  joined_at        timestamptz not null default now(),
  primary key (league_id, user_id)
);


-- ─── NFL SEASONS (GLOBAL) ────────────────────────────────────

create table public.nfl_seasons (
  id         uuid primary key default gen_random_uuid(),
  year       int unique not null,
  is_active  boolean not null default false,
  created_at timestamptz default now()
);

create table public.nfl_weeks (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid references public.nfl_seasons(id) on delete cascade not null,
  week_number int not null,
  week_type   public.week_type not null default 'regular',
  unique(season_id, week_number)
);

create table public.games (
  id            uuid primary key default gen_random_uuid(),
  week_id       uuid references public.nfl_weeks(id) on delete cascade not null,
  home_team     text not null,
  home_abbr     text not null,
  away_team     text not null,
  away_abbr     text not null,
  spread        text,
  kickoff_time  timestamptz not null,
  winner_abbr   text default null,
  espn_game_id  text unique not null,
  created_at    timestamptz default now()
);

create table public.live_game_state (
  game_id       uuid references public.games(id) on delete cascade primary key,
  status        text not null default 'STATUS_SCHEDULED',
  period        int,
  display_clock text,
  home_score    text,
  away_score    text,
  possession    text,
  down_distance text,
  last_play     text,
  is_red_zone   boolean default false,
  updated_at    timestamptz default now()
);


-- ─── LEAGUE SEASONS ──────────────────────────────────────────

create table public.league_seasons (
  id            uuid primary key default gen_random_uuid(),
  league_id     uuid references public.leagues(id) on delete cascade not null,
  nfl_season_id uuid references public.nfl_seasons(id) not null,
  name          text not null,
  is_active     boolean not null default false,
  locked        boolean not null default false,
  created_at    timestamptz default now(),
  unique(league_id, nfl_season_id)
);

create table public.season_settings (
  league_season_id              uuid references public.league_seasons(id) on delete cascade primary key,
  base_correct_pts              numeric not null default 1,
  upset_multiplier              numeric not null default 2,
  sole_correct_bonus            numeric not null default 1,
  wildcard_multiplier           numeric not null default 2,
  divisional_multiplier         numeric not null default 3,
  championship_multiplier       numeric not null default 4,
  superbowl_multiplier          numeric not null default 5,
  weekly_bonus_regular          numeric not null default 2,
  weekly_bonus_scales           boolean not null default true,
  tiebreaker_superbowl_pred     boolean not null default true,
  tiebreaker_playoff_pts        boolean not null default true,
  picks_visible_before_kickoff  boolean not null default false,
  stats_public_default          boolean not null default true,
  theme_override                text default null,
  locked                        boolean not null default false
);


-- ─── PICKS ───────────────────────────────────────────────────

create table public.picks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  game_id           uuid references public.games(id) on delete cascade not null,
  league_season_id  uuid references public.league_seasons(id) on delete cascade not null,
  picked_team_abbr  text not null,
  is_correct        boolean default null,
  is_upset          boolean default null,
  is_sole_correct   boolean default null,
  points_awarded    numeric default null,
  picked_at         timestamptz not null default now(),
  unique(user_id, game_id, league_season_id)
);


-- ─── STREAKS ─────────────────────────────────────────────────

create table public.pick_streaks (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references public.profiles(id) on delete cascade not null,
  league_season_id       uuid references public.league_seasons(id) on delete cascade not null,
  current_correct_streak int not null default 0,
  longest_correct_streak int not null default 0,
  current_wrong_streak   int not null default 0,
  longest_wrong_streak   int not null default 0,
  last_updated           timestamptz default now(),
  unique(user_id, league_season_id)
);


-- ─── TIEBREAKERS ─────────────────────────────────────────────

create table public.superbowl_predictions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references public.profiles(id) on delete cascade not null,
  league_season_id      uuid references public.league_seasons(id) on delete cascade not null,
  predicted_total_score int not null,
  unique(user_id, league_season_id)
);


-- ─── INDEXES ─────────────────────────────────────────────────

create index on public.picks (league_season_id, game_id);
create index on public.picks (user_id, league_season_id);
create index on public.picks (game_id);
create index on public.games (week_id);
create index on public.games (kickoff_time);
create index on public.league_members (user_id);
create index on public.league_seasons (league_id);
create index on public.pick_streaks (user_id, league_season_id);


-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

-- Profiles
alter table public.profiles enable row level security;
create policy "Anyone can view profiles"
  on public.profiles for select using (true);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Leagues
alter table public.leagues enable row level security;
create policy "Members can view their leagues"
  on public.leagues for select using (
    exists (
      select 1 from public.league_members
      where league_id = leagues.id and user_id = auth.uid()
    )
  );
create policy "Only super admin can create leagues"
  on public.leagues for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );
create policy "Commissioner can update league"
  on public.leagues for update using (commissioner_id = auth.uid());

-- League members
alter table public.league_members enable row level security;
create policy "Members can view own memberships"
  on public.league_members for select using (user_id = auth.uid());
create policy "Users can update own membership"
  on public.league_members for update using (user_id = auth.uid());
create policy "Users can insert own membership"
  on public.league_members for insert with check (user_id = auth.uid());

-- NFL seasons
alter table public.nfl_seasons enable row level security;
create policy "Authenticated users can view NFL seasons"
  on public.nfl_seasons for select using (auth.role() = 'authenticated');
create policy "Only super admin can manage NFL seasons"
  on public.nfl_seasons for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );

-- NFL weeks
alter table public.nfl_weeks enable row level security;
create policy "Authenticated users can view NFL weeks"
  on public.nfl_weeks for select using (auth.role() = 'authenticated');
create policy "Only super admin can manage NFL weeks"
  on public.nfl_weeks for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );

-- Games
alter table public.games enable row level security;
create policy "Authenticated users can view games"
  on public.games for select using (auth.role() = 'authenticated');
create policy "Only super admin can manage games"
  on public.games for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );

-- Live game state
alter table public.live_game_state enable row level security;
create policy "Authenticated users can view live state"
  on public.live_game_state for select using (auth.role() = 'authenticated');

-- League seasons
alter table public.league_seasons enable row level security;
create policy "Members can view their league seasons"
  on public.league_seasons for select using (
    exists (
      select 1 from public.league_members
      where league_id = league_seasons.league_id and user_id = auth.uid()
    )
  );
create policy "Commissioner can manage league seasons"
  on public.league_seasons for all using (
    exists (
      select 1 from public.leagues
      where id = league_seasons.league_id and commissioner_id = auth.uid()
    )
  );

-- Season settings
alter table public.season_settings enable row level security;
create policy "Members can view season settings"
  on public.season_settings for select using (
    exists (
      select 1 from public.league_seasons ls
      join public.league_members lm on lm.league_id = ls.league_id
      where ls.id = season_settings.league_season_id
      and lm.user_id = auth.uid()
    )
  );
create policy "Commissioner can manage season settings"
  on public.season_settings for all using (
    exists (
      select 1 from public.league_seasons ls
      join public.leagues l on l.id = ls.league_id
      where ls.id = season_settings.league_season_id
      and l.commissioner_id = auth.uid()
    )
  );

-- Picks
alter table public.picks enable row level security;
create policy "Members can view picks in their leagues"
  on public.picks for select using (
    exists (
      select 1 from public.league_seasons ls
      join public.league_members lm on lm.league_id = ls.league_id
      where ls.id = picks.league_season_id and lm.user_id = auth.uid()
    )
  );
create policy "Users can insert own picks"
  on public.picks for insert with check (auth.uid() = user_id);
create policy "Users can update own picks"
  on public.picks for update using (auth.uid() = user_id);

-- Streaks
alter table public.pick_streaks enable row level security;
create policy "Members can view streaks in their leagues"
  on public.pick_streaks for select using (
    exists (
      select 1 from public.league_seasons ls
      join public.league_members lm on lm.league_id = ls.league_id
      where ls.id = pick_streaks.league_season_id and lm.user_id = auth.uid()
    )
  );

-- Superbowl predictions
alter table public.superbowl_predictions enable row level security;
create policy "Members can view predictions in their leagues"
  on public.superbowl_predictions for select using (
    exists (
      select 1 from public.league_seasons ls
      join public.league_members lm on lm.league_id = ls.league_id
      where ls.id = superbowl_predictions.league_season_id and lm.user_id = auth.uid()
    )
  );
create policy "Users can manage own predictions"
  on public.superbowl_predictions for all using (auth.uid() = user_id);


-- ─── STORAGE ─────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true);

create policy "Avatar images are publicly viewable"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatar"
  on storage.objects for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- ─── INVITE CODE JOIN FUNCTION ───────────────────────────────

create or replace function public.join_league_by_code(code text)
returns json
language plpgsql
security definer
as $$
declare
  league_row     public.leagues%rowtype;
  already_member boolean;
begin
  select * into league_row
  from public.leagues
  where invite_code = upper(trim(code));

  if not found then
    raise exception 'Invalid invite code';
  end if;

  select exists (
    select 1 from public.league_members
    where league_id = league_row.id and user_id = auth.uid()
  ) into already_member;

  if already_member then
    raise exception 'Already a member of this league';
  end if;

  insert into public.league_members (league_id, user_id, role)
  values (league_row.id, auth.uid(), 'member');

  return json_build_object(
    'league_id',   league_row.id,
    'league_name', league_row.name
  );
end;
$$;


-- ─── SUPER ADMIN SETUP ───────────────────────────────────────
-- Run this ONCE after signing up for the first time.
-- Find your user ID in: Supabase Studio → Authentication → Users

-- update public.profiles
--   set is_super_admin = true
--   where id = 'your-user-uuid-here';