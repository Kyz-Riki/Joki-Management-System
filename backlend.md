# Langkah Implementasi — Tim Backend

> **Project:** Joki Management System  
> **Stack:** Next.js API Routes / Server Actions, Supabase (PostgreSQL), Drizzle ORM, Vercel  
> **Referensi:** PRD v1.1

---

## Fase 1: Setup Project & Database

### 1.1 Inisialisasi Project

- [ ] Buat project Next.js baru dengan App Router
  ```bash
  npx -y create-next-app@latest ./ --ts --app --eslint --src-dir --tailwind --import-alias "@/*"
  ```
- [ ] Install dependencies backend:
  ```bash
  npm install drizzle-orm @supabase/supabase-js bcrypt jsonwebtoken
  npm install -D drizzle-kit @types/bcrypt @types/jsonwebtoken
  ```
- [ ] Setup environment variables (`.env.local`):
  ```
  DATABASE_URL=postgresql://...
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_ANON_KEY=...
  SUPABASE_SERVICE_ROLE_KEY=...
  NEXTAUTH_SECRET=...
  TURNSTILE_SECRET_KEY=...
  ```

### 1.2 Setup Database (Supabase)

- [ ] Buat project baru di Supabase Dashboard
- [ ] Jalankan SQL migration untuk membuat tabel sesuai PRD:
  - `owners` — dengan constraint UNIQUE pada `username` dan `email`
  - `workers` — dengan FK ke `owners(id)` ON DELETE CASCADE
  - `containers` — dengan FK ke `owners(id)`, UNIQUE pada `slug` dan `(owner_id, game_code)`
  - `orders` — dengan FK ke `containers(id)` dan `workers(id)`, UNIQUE pada `(container_id, queue_number)`
  - `registration_attempts` — untuk rate limiting
- [ ] Buat indexes:
  - `idx_containers_slug` pada `containers(slug)`
  - `idx_orders_container_id` pada `orders(container_id)`
  - `idx_orders_status` pada `orders(container_id, status)`
  - `idx_registration_ip` pada `registration_attempts(ip_address, attempted_at)`
- [ ] Buat trigger `update_updated_at` untuk tabel `orders`
- [ ] Enable Supabase Realtime pada tabel `orders` (untuk fitur publik page)

### 1.3 Setup Drizzle ORM Schema

- [ ] Buat file `src/db/schema.ts` — definisikan semua tabel menggunakan Drizzle schema
- [ ] Buat file `src/db/index.ts` — setup koneksi database
- [ ] Buat file `drizzle.config.ts` — konfigurasi Drizzle Kit
- [ ] Test koneksi: `npx drizzle-kit push`

---

## Fase 2: Authentication System

### 2.1 Registrasi

- [ ] Buat API Route: `POST /api/auth/register`
  - Validasi input: `username`, `email`, `password` (gunakan Zod)
  - Cek **honeypot field** — jika terisi, return 200 OK diam-diam (jangan kasih error)
  - **Verifikasi Cloudflare Turnstile** — kirim token ke `https://challenges.cloudflare.com/turnstile/v0/siteverify`
  - **Rate Limiting per IP:**
    - Query tabel `registration_attempts` — hitung jumlah attempt dari IP yang sama dalam 1 jam terakhir
    - Jika >= 3, tolak dengan error `429 Too Many Requests`
    - Jika lolos, insert record baru ke `registration_attempts`
  - Cek apakah `username` atau `email` sudah ada di database
  - Hash password menggunakan `bcrypt` (salt rounds: 12)
  - Insert ke tabel `owners`
  - Return success response

### 2.2 Login

- [ ] Buat API Route: `POST /api/auth/login`
  - Validasi input: `username`, `password`
  - Query owner berdasarkan `username`
  - Bandingkan password dengan hash menggunakan `bcrypt.compare()`
  - Generate JWT token dengan payload `{ ownerId, username }` — expire 7 hari
  - Set HTTP-only cookie dengan token tersebut
  - Return data owner (tanpa password_hash)

### 2.3 Session & Middleware

- [ ] Buat middleware `src/middleware.ts`:
  - Cek keberadaan cookie JWT pada setiap request ke route `/dashboard/*`
  - Jika tidak ada atau expired, redirect ke `/login`
- [ ] Buat utility `src/lib/auth.ts`:
  - Function `verifyToken(token)` — decode & verify JWT
  - Function `getCurrentOwner(request)` — ambil data owner dari token
  - Function `hashPassword(password)` — bcrypt hash
  - Function `comparePassword(plain, hash)` — bcrypt compare

### 2.4 Logout

- [ ] Buat API Route: `POST /api/auth/logout`
  - Hapus cookie JWT
  - Return success

---

## Fase 3: Worker Management API

### 3.1 CRUD Workers

- [ ] `GET /api/workers` — Ambil semua worker milik owner yang sedang login
  - Gunakan `getCurrentOwner()` untuk mendapatkan `owner_id`
  - Query `SELECT * FROM workers WHERE owner_id = ? ORDER BY created_at DESC`

- [ ] `POST /api/workers` — Tambah worker baru
  - Validasi input: `name` (wajib, string, max 50 karakter)
  - **Cek batas:** hitung jumlah worker milik owner, jika sudah **20**, tolak dengan error
  - Insert ke tabel `workers`

- [ ] `PUT /api/workers/[id]` — Update nama worker
  - Validasi: pastikan worker tersebut milik owner yang login (cek `owner_id`)
  - Update field `name`

- [ ] `DELETE /api/workers/[id]` — Hapus worker
  - Validasi kepemilikan
  - Delete dari tabel (orders yang punya `worker_id` ini akan menjadi `NULL` karena ON DELETE SET NULL)

---

## Fase 4: Container Management API

### 4.1 Game Code Enum

- [ ] Buat file `src/lib/constants.ts`:
  ```typescript
  export const GAME_LIST = [
    { code: 'mlbb', name: 'Mobile Legends: Bang Bang' },
    { code: 'val', name: 'Valorant' },
    { code: 'ff', name: 'Free Fire' },
    { code: 'hsr', name: 'Honkai: Star Rail' },
    { code: 'gi', name: 'Genshin Impact' },
    { code: 'aov', name: 'Arena of Valor' },
    { code: 'pubgm', name: 'PUBG Mobile' },
    { code: 'cod', name: 'Call of Duty Mobile' },
  ] as const;
  ```

### 4.2 CRUD Containers

- [ ] `GET /api/containers` — Ambil semua container milik owner
  - Include jumlah order aktif (QUEUE + PROGRESS) per container

- [ ] `POST /api/containers` — Buat container baru
  - Validasi input: `game_code` (harus ada di GAME_LIST enum)
  - **Cek batas:** jika owner sudah punya **5 container**, tolak
  - **Cek duplikasi:** jika owner sudah punya container dengan `game_code` yang sama, tolak
  - Generate slug otomatis: `/q/{username-owner}/{game-code}`
  - Auto-resolve `game_name` dari `GAME_LIST`
  - Insert ke tabel `containers` dengan `is_active = true`

- [ ] `PATCH /api/containers/[id]` — Toggle `is_active`
  - Validasi kepemilikan
  - Toggle boolean `is_active`

- [ ] `DELETE /api/containers/[id]` — Hapus container
  - Validasi kepemilikan
  - Hapus container (cascade akan menghapus semua orders di dalamnya)
  - **Penting:** Endpoint ini memerlukan konfirmasi — kirim body `{ confirm: true }`

### 4.3 Get Available Games

- [ ] `GET /api/games` — Return daftar game yang tersedia
  - Cocokkan dengan container yang sudah dimiliki owner
  - Return game list dengan flag `already_used: boolean`

---

## Fase 5: Order Management API

### 5.1 CRUD Orders

- [ ] `GET /api/containers/[containerId]/orders` — Ambil semua order dalam container
  - Support query params: `?status=QUEUE,PROGRESS` atau `?status=DONE,ARCHIVED`
  - Urutkan: PROGRESS di atas, lalu QUEUE, lalu berdasarkan `created_at`
  - Include data worker name (JOIN dengan tabel workers)

- [ ] `POST /api/containers/[containerId]/orders` — Buat order baru
  - Validasi input: `customer_name`, `details`, `worker_id`
  - **Cek batas:** hitung order aktif (QUEUE + PROGRESS) di container ini, jika sudah **50**, tolak
  - Auto-increment `queue_number`:
    ```sql
    SELECT COALESCE(MAX(queue_number), 0) + 1 FROM orders WHERE container_id = ?
    ```
  - Status default: `QUEUE`
  - Insert ke tabel `orders`

- [ ] `DELETE /api/containers/[containerId]/orders/[orderId]` — Hapus order permanen
  - Validasi kepemilikan (lewat container → owner)
  - Wajib body `{ confirm: true }`

### 5.2 Status Transition

- [ ] `PATCH /api/containers/[containerId]/orders/[orderId]/status` — Ubah status order
  - Validasi input: `action` (harus salah satu dari: `process`, `complete`, `archive`, `reactivate`)
  - Validasi transisi yang diperbolehkan:
    ```
    process:    QUEUE → PROGRESS
    complete:   PROGRESS → DONE
    archive:    DONE → ARCHIVED
    reactivate: ARCHIVED → QUEUE
    ```
  - Jika transisi tidak valid, return error `400 Bad Request`
  - Update status dan `updated_at`

### 5.3 Auto-Archive (Opsional — Cron Job)

- [ ] Buat API Route: `POST /api/cron/auto-archive`
  - Proteksi: hanya bisa dipanggil dengan `CRON_SECRET` header
  - Query semua order berstatus `DONE` yang `updated_at` > 30 hari lalu
  - Update status menjadi `ARCHIVED` secara batch
  - Setup Vercel Cron Job di `vercel.json`:
    ```json
    {
      "crons": [{
        "path": "/api/cron/auto-archive",
        "schedule": "0 2 * * *"
      }]
    }
    ```

---

## Fase 6: Public Queue API

### 6.1 Public Endpoint

- [ ] `GET /api/public/queue/[slug]` — Ambil data antrean publik
  - **Tidak memerlukan authentication**
  - Cari container berdasarkan `slug`
  - Jika container tidak ditemukan: return `404`
  - Jika `is_active = false`: return `{ status: 'closed', message: 'Antrean sedang tutup' }`
  - Jika aktif, return:
    - Daftar order berstatus `QUEUE` dan `PROGRESS` saja
    - Sensor nama customer: tampilkan 2 karakter pertama + `***` + 2 karakter terakhir
      ```typescript
      function censorName(name: string): string {
        if (name.length <= 4) return name[0] + '***';
        return name.slice(0, 2) + '***' + name.slice(-2);
      }
      ```
    - Field yang di-return per order: `queue_number`, `censored_name`, `status`, `created_at`
    - **Jangan expose:** worker name, details, order id
  - Summary stats:
    - Total order QUEUE
    - Total order PROGRESS
    - Total order DONE hari ini

### 6.2 Realtime (Supabase)

- [ ] Enable Realtime pada tabel `orders` di Supabase Dashboard
- [ ] Buat utility `src/lib/supabase-realtime.ts`:
  - Setup subscription channel per container
  - Listen pada event `UPDATE` di tabel `orders` yang `container_id` match
  - Broadcast perubahan status ke client

---

## Fase 7: Validation & Security

### 7.1 Input Validation

- [ ] Install Zod: `npm install zod`
- [ ] Buat validation schemas di `src/lib/validations.ts`:
  ```typescript
  // Register
  registerSchema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    turnstileToken: z.string(),
    honeypot: z.string().max(0).optional(), // harus kosong
  })

  // Worker
  workerSchema = z.object({
    name: z.string().min(1).max(50).trim(),
  })

  // Container
  containerSchema = z.object({
    game_code: z.enum(['mlbb', 'val', 'ff', 'hsr', 'gi', 'aov', 'pubgm', 'cod']),
  })

  // Order
  orderSchema = z.object({
    customer_name: z.string().min(1).max(100).trim(),
    details: z.string().max(500).optional(),
    worker_id: z.string().uuid(),
  })
  ```

### 7.2 Error Handling

- [ ] Buat file `src/lib/errors.ts`:
  - Custom error classes: `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ValidationError`, `ConflictError`, `RateLimitError`
  - Helper function `handleApiError(error)` yang return Response dengan status code yang tepat

### 7.3 Rate Limiting Middleware

- [ ] Buat Edge Middleware di `src/middleware.ts`:
  - Untuk route `/api/auth/register`:
    - Ambil IP dari request header (`x-forwarded-for`)
    - Query `registration_attempts` — hitung attempt dalam 1 jam terakhir
    - Jika >= 3, return `429`
  - Untuk route `/dashboard/*`:
    - Verifikasi JWT cookie

---

## Fase 8: Testing & Deployment

### 8.1 Testing

- [ ] Install testing tools:
  ```bash
  npm install -D vitest @testing-library/react
  ```
- [ ] Tulis unit test untuk:
  - Utility functions (censorName, hashPassword, verifyToken)
  - Validation schemas (semua edge cases)
  - Status transition logic
- [ ] Tulis integration test untuk:
  - Auth flow (register → login → access protected route)
  - CRUD workers (create, batas 20, delete)
  - CRUD containers (create, batas 5, duplikasi game_code)
  - CRUD orders (create, batas 50, status transition)
  - Public queue endpoint (censored data, closed container)

### 8.2 Deployment

- [ ] Setup project di Vercel Dashboard
- [ ] Konfigurasi environment variables di Vercel
- [ ] Konfigurasi Vercel Cron Job untuk auto-archive
- [ ] Setup Cloudflare Turnstile:
  - Daftar di Cloudflare Dashboard
  - Dapatkan Site Key (untuk frontend) dan Secret Key (untuk backend)
- [ ] Test deployment di staging
- [ ] Deploy ke production

---

## Ringkasan Endpoint API

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| `POST` | `/api/auth/register` | ❌ | Registrasi owner baru |
| `POST` | `/api/auth/login` | ❌ | Login owner |
| `POST` | `/api/auth/logout` | ✅ | Logout |
| `GET` | `/api/workers` | ✅ | List workers |
| `POST` | `/api/workers` | ✅ | Tambah worker |
| `PUT` | `/api/workers/[id]` | ✅ | Update worker |
| `DELETE` | `/api/workers/[id]` | ✅ | Hapus worker |
| `GET` | `/api/containers` | ✅ | List containers |
| `POST` | `/api/containers` | ✅ | Buat container |
| `PATCH` | `/api/containers/[id]` | ✅ | Toggle active |
| `DELETE` | `/api/containers/[id]` | ✅ | Hapus container |
| `GET` | `/api/games` | ✅ | List game tersedia |
| `GET` | `/api/containers/[cId]/orders` | ✅ | List orders |
| `POST` | `/api/containers/[cId]/orders` | ✅ | Buat order |
| `PATCH` | `/api/containers/[cId]/orders/[oId]/status` | ✅ | Ubah status |
| `DELETE` | `/api/containers/[cId]/orders/[oId]` | ✅ | Hapus order |
| `GET` | `/api/public/queue/[slug]` | ❌ | Public queue |
| `POST` | `/api/cron/auto-archive` | 🔑 | Auto archive cron |

---

## Catatan Penting untuk Tim Backend

> [!IMPORTANT]
> **Urutan Pengerjaan:** Fase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Setiap fase bergantung pada fase sebelumnya.

> [!WARNING]
> **Jangan simpan data akun game customer** (email/password game mereka) di database. Data sensitif ini tetap dikomunikasikan via WhatsApp sesuai PRD.

> [!TIP]
> **Gunakan Server Actions** untuk operasi CRUD yang dipanggil dari form/komponen React, dan **API Routes** untuk endpoint yang perlu diakses secara publik atau dari cron job.
