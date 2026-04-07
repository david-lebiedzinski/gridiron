-- Create admin user in auth.users and matching profile
do $$
declare
  admin_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    raw_app_meta_data,
    raw_user_meta_data
  ) values (
    admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'david@gridiron.test',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  );

  insert into auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    admin_id,
    admin_id,
    admin_id::text,
    'email',
    jsonb_build_object('sub', admin_id::text, 'email', 'david@gridiron.test'),
    now(),
    now(),
    now()
  );

  insert into public.profile (id, name, is_admin)
  values (admin_id, 'David', true);
end $$;
