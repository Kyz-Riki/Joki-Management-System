-- ============================================================
-- Migration: Tambah kolom uid ke tabel orders (Strategi B)
-- Digunakan untuk production yang sudah ada data.
-- Jalankan query ini satu per satu di Supabase SQL Editor.
-- ============================================================

-- Step 1: Tambah kolom uid sebagai nullable dulu
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uid TEXT UNIQUE;

-- Step 2: Backfill — isi UID untuk semua baris yang sudah ada
-- Menggunakan LEFT(MD5(RANDOM()::TEXT), 6) dikonversi ke uppercase
UPDATE orders
SET uid = UPPER(LEFT(MD5(RANDOM()::TEXT), 6))
WHERE uid IS NULL;

-- Step 3: Enforce NOT NULL setelah semua baris sudah terisi
ALTER TABLE orders ALTER COLUMN uid SET NOT NULL;

-- Verifikasi hasil:
-- SELECT id, uid, queue_number, customer_name FROM orders LIMIT 10;
