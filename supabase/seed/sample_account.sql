-- ============================================================
-- Sample Test Account — Joki Management System
-- ============================================================
-- Jalankan script ini di Supabase SQL Editor
--
-- Kredensial akun:
--   Username : izumi384
--   Email    : riki384@gmail.com
--   Password : rikiriki123
-- ============================================================

DO $$
DECLARE
  v_user_id  uuid := gen_random_uuid();
  v_email    text := 'riki384@gmail.com';
  v_username text := 'izumi384';
  v_password text := 'rikiriki123';
BEGIN

  -- ── 1. Buat user di Supabase Auth (auth.users) ────────────────────────────
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    crypt(v_password, gen_salt('bf')),        -- bcrypt hash otomatis via pgcrypto
    now(),                                    -- email langsung dianggap terverifikasi
    jsonb_build_object('username', v_username),
    jsonb_build_object(
      'provider',  'email',
      'providers', jsonb_build_array('email')
    ),
    now(),
    now(),
    false,
    '',
    '',
    '',
    ''
  );

  -- ── 2. Daftarkan identity email (auth.identities) ─────────────────────────
  --      Dibutuhkan agar signInWithPassword bisa menemukan akun ini.
  INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id::text,
    v_user_id,
    jsonb_build_object(
      'sub',            v_user_id::text,
      'email',          v_email,
      'email_verified', true
    ),
    'email',
    now(),
    now(),
    now()
  );

  -- ── 3. Buat record di tabel owners (public.owners) ────────────────────────
  --      ID harus sama dengan Supabase Auth user ID di atas.
  INSERT INTO public.owners (id, username, email, created_at)
  VALUES (v_user_id, v_username, v_email, now());

  RAISE NOTICE '✅ Akun test berhasil dibuat — UUID: %', v_user_id;

END $$;
