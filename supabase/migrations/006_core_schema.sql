-- ─── Season ──────────────────────────────────────────────────

create table public.season (
  id         uuid primary key default gen_random_uuid(),
  year       int not null unique,
  start_date date not null,
  end_date   date not null,
);

comment on table public.season is 'NFL season — one per year';
comment on column public.season.year is 'NFL season year (e.g. 2025)';
comment on column public.season.start_date is 'First day of the season (preseason or reg week 1)';
comment on column public.season.end_date is 'Last day of the season (after Super Bowl)';

-- ─── Team ────────────────────────────────────────────────────

create table public.team (
  id         uuid primary key default gen_random_uuid(),
  abbr       text not null unique,
  city       text not null,
  name       text not null,
  conference text not null check (conference in ('AFC', 'NFC')),
  division   text not null check (division in ('East', 'West', 'North', 'South')),
  color      text
);

comment on table public.team is 'NFL team — static reference data';
comment on column public.team.abbr is 'Team abbreviation (e.g. "NE")';
comment on column public.team.city is 'City or region (e.g. "New England")';
comment on column public.team.name is 'Team name (e.g. "Patriots")';
comment on column public.team.conference is 'AFC or NFC';
comment on column public.team.division is 'Division within the conference';
comment on column public.team.color is 'Primary team color hex (e.g. "#002244")';

-- ─── Team Record ─────────────────────────────────────────────

create table public.team_record (
  team_id    uuid not null references public.team(id) on delete cascade,
  season_id  uuid not null references public.season(id) on delete cascade,
  wins       int not null default 0,
  losses     int not null default 0,
  ties       int not null default 0,

  primary key (team_id, season_id)
);

comment on table public.team_record is 'Win/loss/tie record per team per season';
comment on column public.team_record.wins is 'Total wins in this season';
comment on column public.team_record.losses is 'Total losses in this season';
comment on column public.team_record.ties is 'Total ties in this season';

-- ─── Week ────────────────────────────────────────────────────

create table public.week (
  id         uuid primary key default gen_random_uuid(),
  season_id  uuid not null references public.season(id) on delete cascade,
  type       text not null check (type in ('pre', 'reg', 'post')),
  number     int not null,
  name       text,
  start_date date not null,
  end_date   date not null,
  unique (season_id, type, number)
);

comment on table public.week is 'A week within a season — groups games by schedule window';
comment on column public.week.type is 'Phase of the season: pre (preseason), reg (regular), post (postseason)';
comment on column public.week.number is 'Week number relative to its type (e.g. reg week 1, post week 1)';
comment on column public.week.name is 'Display name (e.g. "Wild Card", "Super Bowl") — null for regular season';
comment on column public.week.start_date is 'First game day of this week';
comment on column public.week.end_date is 'Last game day of this week (typically Monday/Tuesday)';

-- ─── Game ────────────────────────────────────────────────────

create table public.game (
  id             uuid primary key default gen_random_uuid(),
  season_id      uuid not null references public.season(id) on delete cascade,
  week_id        uuid not null references public.week(id) on delete cascade,
  home_team_id   uuid not null references public.team(id),
  away_team_id   uuid not null references public.team(id),
  description    text,
  kickoff_time   timestamptz not null,
  status         text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'halftime', 'final')),
  home_score     int default 0,
  away_score     int default 0,
  spread         numeric,
  period         int,
  display_clock  text,
  possession_id  uuid references public.team(id),
  down_distance  text,
  last_play      text,
  is_red_zone    boolean default false,
  winner_id      uuid references public.team(id),
  espn_game_id   text unique not null
);

comment on table public.game is 'NFL game — static schedule data + live state in one row';
comment on column public.game.season_id is 'Denormalized FK for quick season-level queries';
comment on column public.game.home_team_id is 'FK to home team';
comment on column public.game.away_team_id is 'FK to away team';
comment on column public.game.description is 'Optional label (e.g. "NFC Championship", "International - UK")';
comment on column public.game.kickoff_time is 'Scheduled kickoff — does not change for delays';
comment on column public.game.status is 'Current game state: scheduled → in_progress → halftime → final';
comment on column public.game.home_score is 'Current or final home score';
comment on column public.game.away_score is 'Current or final away score';
comment on column public.game.spread is 'Point spread (positive = home favored)';
comment on column public.game.period is 'Current quarter (1-4) or overtime (5+)';
comment on column public.game.display_clock is 'Game clock as displayed (e.g. "5:32")';
comment on column public.game.possession_id is 'FK to team with current possession';
comment on column public.game.down_distance is 'Current down and distance (e.g. "3rd & 7")';
comment on column public.game.last_play is 'Description of the most recent play';
comment on column public.game.is_red_zone is 'Whether the team with possession is in the red zone';
comment on column public.game.winner_id is 'FK to winning team — set when status is final';
comment on column public.game.espn_game_id is 'ESPN API game identifier for syncing';

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
  stats_public_default         boolean not null default true,
);

comment on table public.league is 'A pick-em league — settings live directly on the league';
comment on column public.league.invite_code is 'Shareable code for joining the league';
comment on column public.league.base_correct_pts is 'Points awarded for a correct pick';
comment on column public.league.upset_multiplier is 'Multiplier applied when picking the underdog correctly';
comment on column public.league.sole_correct_bonus is 'Bonus points when you are the only one who picked correctly';
comment on column public.league.wildcard_multiplier is 'Point multiplier for Wild Card round games';
comment on column public.league.divisional_multiplier is 'Point multiplier for Divisional round games';
comment on column public.league.championship_multiplier is 'Point multiplier for Conference Championship games';
comment on column public.league.superbowl_multiplier is 'Point multiplier for the Super Bowl';
comment on column public.league.weekly_bonus_regular is 'Bonus points for the most correct picks in a regular season week';
comment on column public.league.weekly_bonus_scales is 'Whether the weekly bonus scales with league size';
comment on column public.league.picks_visible_before_kickoff is 'Show other players picks before game starts';
comment on column public.league.stats_public_default is 'Members can view each other analytics by default';

-- ─── Profile ─────────────────────────────────────────────────

create table public.profile (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text not null,
  avatar          text,
  favorite_team_id uuid references public.team(id),
  is_admin        boolean not null default false,
  theme_intensity text not null default 'normal' check (theme_intensity in ('off', 'subtle', 'normal', 'full'))
);

comment on table public.profile is 'User profile — extends auth.users with app-specific data';
comment on column public.profile.id is 'FK to auth.users — one profile per user';
comment on column public.profile.name is 'Display name shown in the grid and leaderboard';
comment on column public.profile.avatar is 'Avatar URL or color identifier';
comment on column public.profile.favorite_team_id is 'FK to favorite team — used for background theming';
comment on column public.profile.is_admin is 'Super admin flag — grants access to the admin panel';
comment on column public.profile.theme_intensity is 'How strongly the favorite team theme is applied';

-- ─── League Members ──────────────────────────────────────────

create table public.league_member (
  league_id  uuid not null references public.league(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  
  primary key (league_id, user_id)
);

comment on table public.league_member is 'Join table linking users to leagues';

-- ─── Pick ────────────────────────────────────────────────────

create table public.pick (
  league_id        uuid not null references public.league(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  game_id          uuid not null references public.game(id) on delete cascade,
  team_id          uuid not null references public.team(id),
  is_correct       boolean,
  is_sole_correct  boolean,
  points           int,

  primary key (league_id, user_id, game_id)
);

comment on table public.pick is 'A single pick — one per user per game per league';
comment on column public.pick.team_id is 'FK to the team picked';
comment on column public.pick.is_correct is 'Whether the pick matched the winner — null until game is final';
comment on column public.pick.is_sole_correct is 'Whether this was the only correct pick in the league — null until final';
comment on column public.pick.points is 'Cached points awarded for this pick — null until game is final';

-- ─── Week Bonus ──────────────────────────────────────────────

create table public.week_bonus (
  league_id  uuid not null references public.league(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  week_id    uuid not null references public.week(id) on delete cascade,
  points     int not null,

  primary key (league_id, user_id, week_id)
);

comment on table public.week_bonus is 'Weekly bonus awarded to the member(s) with the most correct picks — supports ties';
comment on column public.week_bonus.points is 'Bonus points awarded for winning the week';

-- ─── Indexes ─────────────────────────────────────────────────

create index idx_week_season on public.week(season_id);
create index idx_game_season on public.game(season_id);
create index idx_game_week on public.game(week_id);
create index idx_game_kickoff on public.game(kickoff_time);

-- ─── RLS ─────────────────────────────────────────────────────

alter table public.team enable row level security;
alter table public.team_record enable row level security;
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

create policy "Authenticated users can view team records"
  on public.team_record for select using (auth.role() = 'authenticated');

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

-- Admin write access (is_admin on profile)
create policy "Admins can manage teams"
  on public.team for all using (
    exists (select 1 from public.profile where id = auth.uid() and is_admin = true)
  );

create policy "Admins can manage team records"
  on public.team_record for all using (
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

-- Users can insert/update/delete their own picks
create policy "Users can manage their own picks"
  on public.pick for all using (user_id = auth.uid());

-- Users can insert their own league membership (joining via invite code)
create policy "Users can join leagues"
  on public.league_member for insert with check (user_id = auth.uid());

-- Users can leave leagues
create policy "Users can leave leagues"
  on public.league_member for delete using (user_id = auth.uid());

-- ─── Realtime ────────────────────────────────────────────────

alter publication supabase_realtime add table public.game;
