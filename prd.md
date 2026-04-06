# Product Requirements Document (PRD)
# Joki Management System (Open Source)

**Versi:** 1.1  
**Terakhir Diperbarui:** 2025  
**Status:** Draft Revisi

---

## 1. Project Overview

| Field | Detail |
|---|---|
| **Project Name** | Joki Management System |
| **Objective** | Menyediakan platform manajemen operasional bagi Owner Joki untuk mengelola antrean, worker, dan transparansi status pesanan kepada pelanggan melalui link publik. |
| **Target User** | Owner Joki Game (MLBB, Valorant, dll) yang masih menggunakan sistem manual (WhatsApp/Excel). |

---

## 2. User Roles

| Role | Deskripsi |
|---|---|
| **Owner (Admin)** | Pengguna yang mendaftar, membuat container per game, menginput pesanan, dan mengelola worker. Memiliki akses penuh ke dashboard private. |
| **Customer (Viewer)** | Pelanggan yang mengakses link publik untuk memantau status antrean mereka tanpa perlu login. |

---

## 3. Functional Requirements

### 3.1 Authentication — Low Friction

- **Registrasi:** Form sederhana (Username, Email, Password). Tidak perlu verifikasi email.
- **Login:** Menggunakan Username dan Password.
- **Session:** Tetap login selama 7 hari (menggunakan NextAuth atau Supabase Auth).

**Anti-Abuse pada Registrasi:**

Karena tidak ada verifikasi email, sistem menerapkan tiga lapisan perlindungan berikut:

1. **Rate Limiting per IP** — Menggunakan Upstash Redis (terintegrasi dengan Vercel Edge Middleware). Batas: maksimal 3 akun baru per IP per jam.
2. **Cloudflare Turnstile** — CAPTCHA invisible/non-annoying di form registrasi untuk memblokir bot secara efektif.
3. **Unique Constraint di Database** — Kolom `username` dan `email` memiliki constraint `UNIQUE`. Satu email hanya bisa terdaftar untuk satu akun.
4. **Honeypot Field** *(Opsional)* — Hidden input di form yang tidak terlihat user tapi diisi otomatis oleh bot. Jika field ini terisi, request ditolak diam-diam tanpa pesan error.

---

### 3.2 Owner Dashboard (Private)

#### Worker Management
- CRUD (Create, Read, Update, Delete) daftar nama worker milik owner tersebut.
- Batas maksimal: **20 worker per owner**.

#### Container Management

Setiap container merepresentasikan satu layanan joki untuk satu jenis game. Owner memilih game terlebih dahulu, lalu sistem membuat container beserta URL slug-nya secara otomatis.

**Format URL Slug:**
```
/q/{username-owner}/{game-code}
```
**Contoh:** `/q/izumi-store/mlbb`, `/q/izumi-store/val`

**Aturan Slug:**
- Slug di-generate otomatis berdasarkan username owner dan kode game yang dipilih.
- Satu owner hanya dapat memiliki **satu container per game** (mencegah duplikasi).
- Slug bersifat permanen dan tidak dapat diubah setelah container dibuat. Jika owner ingin menggantinya, container lama harus dihapus dan dibuat ulang.
- Kode game menggunakan enum yang telah ditentukan sistem (contoh: `mlbb`, `val`, `ff`, `hsr`, dll).

**Fitur Container:**
- **Toggle Active/Hide:** Sakelar untuk mengaktifkan atau menonaktifkan akses link publik.
  - Saat `is_active = false`, pelanggan yang membuka URL akan diarahkan ke halaman informatif bertuliskan *"Antrean sedang tutup"* — bukan halaman 404.
- **Delete Container:** Menghapus container beserta seluruh data pesanan di dalamnya secara permanen (tindakan ini membutuhkan konfirmasi dua langkah).
- **Batas maksimal:** **5 container per owner**.

#### Order Management (di dalam Container)

**Input Order:**
- Nama Customer (IGN/In-Game Name)
- Detail pesanan (Rank target / Paket layanan)
- Pilih Worker yang ditugaskan

**Status Flow:**

Order yang baru diinput tidak langsung diproses. Owner harus secara eksplisit mengklik tombol aksi untuk memindahkan status.

```
[Input Order] → QUEUE
                  ↓  (Owner klik "Proses")
              PROGRESS  ← tampil di atas daftar
                  ↓  (Owner klik "Selesai")
                DONE
                  ↓  (Opsional, auto setelah 30 hari)
              ARCHIVED
```

**Tampilan Dashboard (Urutan Visual):**
1. **Section PROGRESS** — Order yang sedang dikerjakan, tampil paling atas.
2. **Section QUEUE** — Order yang menunggu diproses, tampil di bawah.
3. **Tab/Halaman Terpisah** — Riwayat order berstatus DONE dan ARCHIVED.

**Aksi pada Order:**
- **Proses:** Mengubah status dari `QUEUE` → `PROGRESS`.
- **Selesai:** Mengubah status dari `PROGRESS` → `DONE`.
- **Arsip:** Mengubah status menjadi `ARCHIVED` (tidak menghapus data dari database). Order dapat diaktifkan kembali jika diperlukan.
- **Hapus Permanen:** Menghapus entri order secara permanen dari database, membutuhkan konfirmasi eksplisit.

**Batas Order:**
- Maksimal **50 order aktif** (status `QUEUE` atau `PROGRESS`) per container.
- Maksimal **200 order** berstatus `DONE` atau `ARCHIVED` per container sebelum di-auto-archive.

---

### 3.3 Public Queue Page (Publik)

Halaman ini dapat diakses siapa saja melalui URL slug tanpa perlu login.

**Informasi yang Ditampilkan:**

| Kolom | Detail |
|---|---|
| Nomor Antrian | Auto-increment per container (bukan database ID) |
| Username Customer | Disensor — contoh: `iz***i` (2 karakter pertama + 2 terakhir) |
| Waktu Masuk | Timestamp order dibuat (`created_at`) |
| Status | Badge berwarna: `QUEUE` / `PROGRESS` / `DONE` |

> **Catatan:** Nama worker, detail rank/paket, dan informasi sensitif lainnya **tidak ditampilkan** di halaman publik. Halaman ini hanya untuk transparansi status antrian.

**Summary Stats:**
Menampilkan ringkasan jumlah order berdasarkan status (total antrean, sedang proses, selesai hari ini) untuk meningkatkan kepercayaan pelanggan.

**Handling Jika Container Tidak Aktif:**
Jika `is_active = false`, halaman publik menampilkan pesan *"Antrean sedang tutup"* — bukan halaman error atau 404.

---

## 4. Non-Functional Requirements

| Aspek | Detail |
|---|---|
| **Mobile-First Design** | Pelanggan joki mayoritas mengakses melalui smartphone. Seluruh UI dirancang dengan pendekatan mobile-first. |
| **Performance** | Halaman publik menggunakan Next.js SSR/ISR dengan target loading di bawah 2 detik. Pertimbangkan Supabase Realtime (WebSocket) untuk update status otomatis tanpa refresh. |
| **Security** | Password di-hash menggunakan bcrypt/argon2. Data sensitif akun game (Email/Password akun game customer) tidak disimpan di sistem ini — tetap dikomunikasikan via WhatsApp. |
| **Scalability** | Menggunakan PostgreSQL via Supabase untuk menangani ratusan hingga ribuan baris antrean. |
| **Abuse Prevention** | Rate limiting per IP + Cloudflare Turnstile pada endpoint registrasi. |

---

## 5. Technical Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, shadcn/ui |
| Backend | Next.js Server Actions / API Routes |
| Database | PostgreSQL via Supabase |
| Realtime | Supabase Realtime (WebSocket) — untuk update status publik |
| ORM | Drizzle ORM |
| Hosting | Vercel |
| Rate Limiting | supabase ip rate limit + Vercel Edge Middleware |

---

## 6. Database Schema

-- Owners
CREATE TABLE owners (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text UNIQUE NOT NULL,
  email         text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamp DEFAULT now()
);

-- Workers
CREATE TABLE workers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid REFERENCES owners(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Containers
CREATE TABLE containers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid REFERENCES owners(id) ON DELETE CASCADE,
  game_name  text NOT NULL,
  game_code  text NOT NULL,
  slug       text UNIQUE NOT NULL,
  is_active  boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  UNIQUE(owner_id, game_code)
);

-- Orders
CREATE TABLE orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id  uuid REFERENCES containers(id) ON DELETE CASCADE,
  worker_id     uuid REFERENCES workers(id) ON DELETE SET NULL,
  queue_number  integer NOT NULL,
  customer_name text NOT NULL,
  details       text,
  status        text DEFAULT 'QUEUE',
  created_at    timestamp DEFAULT now(),
  updated_at    timestamp DEFAULT now(),
  UNIQUE(container_id, queue_number)
);

-- Registration Attempts (rate limiting)
CREATE TABLE registration_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address   text NOT NULL,
  attempted_at timestamp DEFAULT now()
);

-- Index
CREATE INDEX idx_containers_slug ON containers(slug);
CREATE INDEX idx_orders_container_id ON orders(container_id);
CREATE INDEX idx_orders_status ON orders(container_id, status);
CREATE INDEX idx_registration_ip ON registration_attempts(ip_address, attempted_at);

-- Trigger updated_at
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
---

## 7. Out of Scope (MVP)

Fitur-fitur berikut secara eksplisit **tidak** termasuk dalam MVP ini untuk menjaga fokus dan timeline:

- Login khusus untuk Worker
- Notifikasi WhatsApp otomatis
- Sistem bagi hasil finansial antara Owner dan Worker
- Fitur pencarian atau filter order
- Multi-bahasa (Internationalization)
- Export data ke Excel/CSV

---

## 8. Future Roadmap (Post-MVP)

Urutan prioritas berdasarkan dampak operasional:

1. **Worker Login** — Akses khusus worker untuk mengupdate status pekerjaan mereka sendiri, sehingga owner tidak perlu selalu update manual.
2. **Real-time Notification** — Push notification ke WhatsApp client saat status order berubah menjadi `DONE`.
3. **Financial Tracker** — Otomatisasi perhitungan bagi hasil antara owner dan worker berdasarkan order yang diselesaikan.