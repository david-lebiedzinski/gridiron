-- Super admin needs delete access to profiles for admin member management.
-- Existing policies: SELECT (anyone), UPDATE (own profile only).

create policy "Super admin can delete profiles"
  on public.profiles for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_super_admin = true
    )
  );
