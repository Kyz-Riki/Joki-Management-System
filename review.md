# Review Notes — Frontend & Backend
# Joki Management System

> Dokumen ini berisi catatan koreksi dan saran dari hasil review dokumen implementasi Frontend dan Backend. Semua poin di bawah sudah disepakati untuk diterapkan.

---

## Bagian 1: Frontend

### 🟡 Koreksi

**1. Nama package shadcn/ui sudah berubah**

Package lama sudah deprecated, gunakan yang baru:

```bash
# ❌ Deprecated
npx shadcn-ui@latest init

# ✅ Gunakan ini
npx shadcn@latest init
```

**2. Supabase Realtime juga dibutuhkan di dashboard owner**

Dokumen hanya menyebut Realtime di public page. Padahal halaman `/dashboard/containers/[containerId]` juga perlu subscribe Realtime agar tampilan owner terupdate otomatis saat ada perubahan status tanpa refresh manual.

- Tambahkan `useRealtimeQueue(containerId)` di halaman order management dashboard
- Hooks yang sama bisa dipakai ulang dari implementasi public page

**3. `queue_number` tidak boleh di-generate di sisi client**

Dokumen frontend tidak menyebut ini secara eksplisit, tapi perlu dicatat: `queue_number` adalah tanggung jawab penuh server/database. Frontend cukup submit form order, nomor antrian dikembalikan dari response API. Jangan ada logika increment di sisi client.

---

### 🔴 Yang Belum Ada

**4. Halaman Landing Page (`/`) tidak didefinisikan**

Di tabel ringkasan ada entri `/ → Landing page / redirect` tapi tidak ada fase pengerjaannya. Perlu ditentukan:
- Apakah ini redirect langsung ke `/login`?
- Atau ada halaman marketing/showcase dulu?

Untuk keperluan porto, halaman landing yang proper akan jadi kesan pertama recruiter atau client. Rekomendasinya: buat halaman landing sederhana yang menjelaskan produk + tombol CTA ke `/register`.

**5. Handling slug tidak ditemukan belum didefinisikan**

Jika user membuka `/q/toko-tidak-ada/mlbb` dan slug tidak ada di database, belum ada spesifikasi tampilan apa yang muncul. Perlu ditambahkan halaman atau komponen khusus "Toko tidak ditemukan" — bukan halaman 404 generik.

**6. UX `CopyButton` belum dispesifikasikan**

Komponen `CopyButton` untuk salin slug URL disebutkan tapi tidak ada detail behavior-nya. Standar UX yang direkomendasikan:
- Setelah diklik, icon berubah dari **copy** menjadi **centang (✓)**
- Setelah 2 detik, kembali ke icon copy semula
- Tambahkan tooltip: *"Salin link"* / *"Tersalin!"*

**7. Sensor nama customer harus dilakukan di server, bukan client**

Dokumen menyebut format sensor `iz***i` tapi tidak jelas di mana logika ini dijalankan. Ini harus dilakukan di **server sebelum response dikirim ke client** — bukan di frontend setelah data diterima. Alasannya: jika dilakukan di client, data nama asli tetap terkirim ke browser dan bisa dilihat via DevTools Network tab.

- Sensor dilakukan di API endpoint `/api/public/queue/[slug]`
- Frontend hanya menerima dan menampilkan data yang sudah disensor

---

### 💡 Saran Tambahan Frontend

**8. Manfaatkan `loading.tsx` dan `error.tsx` bawaan Next.js**

Next.js App Router sudah support file konvensi ini secara native per route segment. Lebih clean daripada handle loading/error di dalam komponen:

```
src/app/dashboard/
├── loading.tsx       # Otomatis tampil saat route loading
├── error.tsx         # Otomatis tangkap error di route ini
└── containers/
    ├── loading.tsx
    └── error.tsx
```

**9. Tambahkan fase khusus untuk SEO & Open Graph public page**

Link public page ini yang disebarkan di bio Instagram/TikTok owner. Open Graph yang proper akan membuat preview link terlihat menarik saat dishare di WhatsApp atau media sosial. Perlu ditambahkan sebagai fase tersendiri, bukan hanya catatan kecil di fase 7.

---

## Bagian 2: Backend

### 🟡 Koreksi

**1. Race condition pada `queue_number`**

Logika berikut berbahaya jika dua request masuk hampir bersamaan:

```sql
-- ❌ Berpotensi menghasilkan queue_number duplikat
SELECT COALESCE(MAX(queue_number), 0) + 1 FROM orders WHERE container_id = ?
```

Dua request bisa membaca nilai MAX yang sama sebelum salah satunya sempat insert, sehingga menghasilkan nomor antrian yang sama. Solusi yang direkomendasikan — gunakan transaksi dengan row lock:

```sql
-- ✅ Atomic dan aman
BEGIN;
SELECT MAX(queue_number) FROM orders WHERE container_id = ? FOR UPDATE;
INSERT INTO orders (..., queue_number) VALUES (..., max + 1);
COMMIT;
```

Alternatif lebih simpel: andalkan constraint `UNIQUE(container_id, queue_number)` yang sudah ada di schema, lalu handle conflict error di aplikasi dengan retry otomatis.

**2. Rate limiting tidak bisa berjalan di Edge Middleware**

Di Fase 7.3 rate limiting ditulis di Edge Middleware (`src/middleware.ts`), tapi Edge Runtime tidak mendukung Drizzle ORM maupun Supabase JS client secara penuh karena keterbatasan Node.js API di environment edge.

Solusi yang direkomendasikan:
- Edge Middleware **hanya untuk JWT/session check** pada route `/dashboard/*`
- Rate limiting check dipindahkan **ke dalam API Route** `/api/auth/register` menggunakan Supabase REST API via `fetch` biasa

**3. Konflik antara JWT manual dan Supabase Auth**

Di fase 1.1 install `@supabase/supabase-js` dan di fase 2 menggunakan `jsonwebtoken` untuk JWT manual. Keduanya menangani session tapi dengan cara berbeda — ini tumpang tindih dan membingungkan.

Pilih salah satu dan konsisten:

| Pilihan | Kelebihan | Kekurangan |
|---|---|---|
| **Supabase Auth** | Built-in session, refresh token otomatis, tidak perlu tulis banyak kode | Sedikit kurang fleksibel |
| **JWT Manual** | Full control, tidak bergantung Supabase Auth | Harus handle refresh token, logout blacklist, dll sendiri |

**Rekomendasi: pakai Supabase Auth.** Lebih simpel, mengurangi kode yang harus ditulis dan dimaintain, cocok untuk skala MVP ini. Jika pilih ini, hapus dependency `jsonwebtoken` dari `package.json`.

**4. `GET /api/games` seharusnya tidak perlu autentikasi**

Endpoint ini hanya return daftar game statis dari konstanta `GAME_LIST` — tidak ada data sensitif. Ubah dari auth ✅ menjadi public ❌ agar frontend bisa fetch tanpa token, misalnya untuk preview slug saat belum login.

---

### 🔴 Yang Belum Ada

**5. Tidak ada helper untuk ownership validation**

Di setiap endpoint yang membutuhkan cek kepemilikan (worker, container, order), dokumen hanya menyebut *"validasi kepemilikan"* tanpa utility function yang konkret. Tanpa ini, developer bisa lupa menambahkan pengecekan dan membuka celah keamanan **Broken Object Level Authorization (BOLA)** — user A bisa menghapus atau mengubah data milik user B.

Tambahkan di `src/lib/auth.ts`:

```typescript
async function assertOwnership(
  ownerId: string,
  resourceId: string,
  table: 'workers' | 'containers' | 'orders'
): Promise<void>
// Throw ForbiddenError jika resource bukan milik owner tersebut
```

Fungsi ini wajib dipanggil di setiap endpoint PUT, PATCH, DELETE sebelum melakukan operasi apapun.

**6. Tidak ada cleanup untuk tabel `registration_attempts`**

Tabel ini akan terus bertambah selamanya karena tidak ada mekanisme hapus data lama. Tambahkan cleanup ke cron job yang sudah ada (`/api/cron/auto-archive`):

```sql
DELETE FROM registration_attempts
WHERE attempted_at < now() - interval '24 hours';
```

Tidak perlu cron job terpisah — cukup jalankan ini sekalian saat auto-archive berjalan setiap malam.

**7. Tidak ada standar format response API**

Dokumen tidak mendefinisikan format response yang konsisten. Ini akan menyebabkan kebingungan saat frontend melakukan integrasi karena setiap endpoint bisa mengembalikan struktur yang berbeda.

Tetapkan satu standar dan gunakan di semua endpoint:

```typescript
// ✅ Success
{ success: true, data: { ... } }

// ✅ Error
{ success: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan.' } }
```

Buat helper function di `src/lib/response.ts`:

```typescript
export const ok = (data: unknown) =>
  Response.json({ success: true, data })

export const err = (code: string, message: string, status: number) =>
  Response.json({ success: false, error: { code, message } }, { status })
```

**8. Endpoint toggle container terlalu generik**

`PATCH /api/containers/[id]` saat ini hanya digunakan untuk toggle `is_active`. Jika nanti ada field lain yang perlu di-update, endpoint ini akan ambigu. Lebih eksplisit dan mudah di-maintain:

```
PATCH /api/containers/[id]/toggle
```

---

### 💡 Saran Tambahan Backend

**9. Buat `src/lib/db-helpers.ts` untuk query yang berulang**

Beberapa query dipakai di banyak tempat seperti hitung jumlah worker, hitung order aktif, cek batas resource. Daripada ditulis ulang di setiap API route, centralisasi ke satu file:

```typescript
export async function countWorkersByOwner(ownerId: string): Promise<number>
export async function countActiveOrders(containerId: string): Promise<number>
export async function countContainersByOwner(ownerId: string): Promise<number>
```

Ini juga memudahkan testing karena logika query terisolasi.

**10. Vercel Cron Job — catat batasan free tier**

Schedule `0 2 * * *` (sekali sehari) masuk dalam free tier Vercel. Namun perlu dicatat di dokumen bahwa:
- Cron Job hanya tersedia mulai plan **Hobby (free)** dengan batas 1 cron job
- Jika butuh lebih dari 1 cron job atau frekuensi lebih tinggi, perlu upgrade ke Pro
- Tambahkan environment variable `CRON_SECRET` dan validasinya di endpoint cron

---

## Ringkasan — Wajib Difix Sebelum Mulai Coding

| # | Area | Isu | Prioritas |
|---|---|---|---|
| 1 | BE | Race condition `queue_number` | 🔴 Kritis |
| 2 | BE | Pilih satu: Supabase Auth atau JWT manual | 🔴 Kritis |
| 3 | BE | Standar format response API | 🔴 Kritis |
| 4 | BE | Ownership validation helper (BOLA vulnerability) | 🔴 Kritis |
| 5 | FE | Nama package shadcn sudah berubah | 🟡 Penting |
| 6 | FE | Sensor nama di server, bukan client | 🟡 Penting |
| 7 | BE | Rate limiting pindah dari Edge ke API Route | 🟡 Penting |
| 8 | FE | Definisikan halaman Landing Page | 🟡 Penting |
| 9 | BE | Cleanup tabel `registration_attempts` | 🟡 Penting |
| 10 | FE | Realtime juga di dashboard owner | 🟡 Penting |
| 11 | BE | `GET /api/games` jadikan public | 🟢 Minor |
| 12 | BE | Rename endpoint toggle container | 🟢 Minor |
| 13 | FE | Spesifikasi UX `CopyButton` | 🟢 Minor |
| 14 | FE | Handling slug tidak ditemukan | 🟢 Minor |