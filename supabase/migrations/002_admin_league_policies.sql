-- Super admin needs full access to leagues for the admin panel.
-- The initial migration only had: SELECT (members), INSERT (super admin), UPDATE (commissioner).
-- Missing: SELECT for super admin, DELETE for super admin.

create policy "Super admin can view all leagues"
  on public.leagues for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );

create policy "Super admin can delete leagues"
  on public.leagues for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );

-- Super admin also needs to insert league_members when creating a league
-- (the creator is auto-joined as commissioner).
-- Current policy only allows user_id = auth.uid(), which works since the admin
-- is inserting themselves. But add a super admin override for safety.
create policy "Super admin can manage league members"
  on public.league_members for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_super_admin = true
    )
  );
