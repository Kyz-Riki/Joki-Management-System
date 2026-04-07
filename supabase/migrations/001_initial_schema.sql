-- =============================================
-- Joki Management System — Initial Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- NOTE: The 'owners' table uses the Supabase Auth user UUID as the primary key.
--       Rows are inserted by the application after auth.admin.createUser() succeeds.

-- ── owners ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owners (
  id            uuid PRIMARY KEY,
  username      text UNIQUE NOT NULL,
  email         text UNIQUE NOT NULL,
  created_at    timestamp with time zone DEFAULT now()
);

-- ── workers ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name          text NOT NULL,
  created_at    timestamp with time zone DEFAULT now()
);

-- ── containers ────────────────────────────────────────────────────────────────
-- slug is stored as "{username}/{game_code}" (no leading slash)
-- The public URL is "/q/{slug}"
CREATE TABLE IF NOT EXISTS containers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  game_name     text NOT NULL,
  game_code     text NOT NULL,
  slug          text UNIQUE NOT NULL,
  is_active     boolean DEFAULT true,
  created_at    timestamp with time zone DEFAULT now(),
  UNIQUE(owner_id, game_code)
);

-- ── orders ────────────────────────────────────────────────────────────────────
-- status values: QUEUE | PROGRESS | DONE | ARCHIVED
CREATE TABLE IF NOT EXISTS orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id  uuid NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  worker_id     uuid REFERENCES workers(id) ON DELETE SET NULL,
  queue_number  integer NOT NULL,
  customer_name text NOT NULL,
  details       text,
  status        text DEFAULT 'QUEUE',
  created_at    timestamp with time zone DEFAULT now(),
  updated_at    timestamp with time zone DEFAULT now(),
  UNIQUE(container_id, queue_number)
);

-- ── registration_attempts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registration_attempts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address    text NOT NULL,
  attempted_at  timestamp with time zone DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_containers_slug ON containers(slug);
CREATE INDEX IF NOT EXISTS idx_orders_container_id ON orders(container_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(container_id, status);
CREATE INDEX IF NOT EXISTS idx_registration_ip ON registration_attempts(ip_address, attempted_at);

-- ── Trigger: auto-update updated_at on orders ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security (RLS) ──────────────────────────────────────────────────
-- Enable RLS so Supabase Realtime respects access control for public table

-- orders: allow public read (for the public queue page via Realtime)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read orders" ON orders
  FOR SELECT USING (true);

-- Allow authenticated users to manage their own data
CREATE POLICY "Owners manage own orders" ON orders
  FOR ALL USING (
    container_id IN (
      SELECT id FROM containers WHERE owner_id = auth.uid()
    )
  );
