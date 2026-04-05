-- Super admin needs INSERT and UPDATE on live_game_state
-- for the admin game editor (simulate, edit, reset).
-- The initial migration only had a SELECT policy for authenticated users.

create policy "Super admin can insert live game state"
  on public.live_game_state for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );

create policy "Super admin can update live game state"
  on public.live_game_state for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );
