-- ============================================================
-- Seed: "The Avengers" league with 10 members
-- Run with: psql $DATABASE_URL -f supabase/seed_avengers.sql
--   or:     supabase db reset  (if added to supabase/seed.sql)
-- ============================================================

-- ── 1. Create auth users ────────────────────────────────────
-- The handle_new_user() trigger auto-creates a profile row for each.

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tony@avengers.test',   crypt('password123', gen_salt('bf')), now(), '{"username":"TonyStark"}'::jsonb,      now(), now()),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'steve@avengers.test',  crypt('password123', gen_salt('bf')), now(), '{"username":"SteveRogers"}'::jsonb,    now(), now()),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natasha@avengers.test',crypt('password123', gen_salt('bf')), now(), '{"username":"NatashaRomanoff"}'::jsonb, now(), now()),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'thor@avengers.test',   crypt('password123', gen_salt('bf')), now(), '{"username":"Thor"}'::jsonb,           now(), now()),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bruce@avengers.test',  crypt('password123', gen_salt('bf')), now(), '{"username":"BruceBanner"}'::jsonb,    now(), now()),
  ('a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'clint@avengers.test',  crypt('password123', gen_salt('bf')), now(), '{"username":"ClintBarton"}'::jsonb,    now(), now()),
  ('a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'wanda@avengers.test',  crypt('password123', gen_salt('bf')), now(), '{"username":"WandaMaximoff"}'::jsonb,  now(), now()),
  ('a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'peter@avengers.test',  crypt('password123', gen_salt('bf')), now(), '{"username":"PeterParker"}'::jsonb,    now(), now()),
  ('a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tchalla@avengers.test',crypt('password123', gen_salt('bf')), now(), '{"username":"TChalla"}'::jsonb,        now(), now()),
  ('a0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carol@avengers.test',  crypt('password123', gen_salt('bf')), now(), '{"username":"CarolDanvers"}'::jsonb,   now(), now())
ON CONFLICT (id) DO NOTHING;

-- ── 2. Make Tony Stark a super admin (commissioner) ─────────

UPDATE public.profiles
SET is_super_admin = true
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- ── 3. Create the league ────────────────────────────────────

INSERT INTO public.leagues (id, name, commissioner_id)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'The Avengers',
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- ── 4. Add all 10 as league members ─────────────────────────

INSERT INTO public.league_members (league_id, user_id, role)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'commissioner'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'member'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'member'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'member'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 'member'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000006', 'member'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000007', 'member'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000008', 'member'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000009', 'member'),
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000010', 'member')
ON CONFLICT DO NOTHING;

-- ── 5. Set profile avatars (DiceBear "adventurer" style) ────

UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=TonyStark'      WHERE id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=SteveRogers'    WHERE id = 'a0000000-0000-0000-0000-000000000002';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=NatashaRomanoff' WHERE id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=Thor'           WHERE id = 'a0000000-0000-0000-0000-000000000004';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=BruceBanner'    WHERE id = 'a0000000-0000-0000-0000-000000000005';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=ClintBarton'    WHERE id = 'a0000000-0000-0000-0000-000000000006';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=WandaMaximoff'  WHERE id = 'a0000000-0000-0000-0000-000000000007';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=PeterParker'    WHERE id = 'a0000000-0000-0000-0000-000000000008';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=TChalla'        WHERE id = 'a0000000-0000-0000-0000-000000000009';
UPDATE public.profiles SET avatar_url = 'https://api.dicebear.com/9.x/adventurer/svg?seed=CarolDanvers'   WHERE id = 'a0000000-0000-0000-0000-000000000010';
