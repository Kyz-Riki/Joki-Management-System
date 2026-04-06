# Langkah Implementasi — Tim Frontend

> **Project:** Joki Management System  
> **Stack:** Next.js (App Router), Tailwind CSS, shadcn/ui, Supabase Realtime  
> **Referensi:** PRD v1.1  
> **Revisi:** Review Notes FE v1.1

---

## Fase 1: Setup Project & Design System

### 1.1 Inisialisasi Frontend

- [ ] Setup Tailwind CSS (sudah termasuk saat create-next-app)
- [ ] Install & konfigurasi shadcn/ui:
  ```bash
  # ✅ Gunakan perintah terbaru (shadcn-ui sudah deprecated)
  npx shadcn@latest init
  ```
- [ ] Install komponen shadcn/ui yang dibutuhkan:
  ```bash
  npx shadcn@latest add button input label card badge dialog alert-dialog dropdown-menu table tabs switch toast separator skeleton avatar sheet
  ```
- [ ] Install dependencies tambahan:
  ```bash
  npm install @supabase/supabase-js lucide-react
  ```

### 1.2 Setup Design System

- [ ] Konfigurasi tema di `tailwind.config.ts`:
  - Warna utama (primary, secondary, accent)
  - Dark mode support (opsional untuk MVP, tapi siapkan fondasi)
  - Custom spacing & border radius
- [ ] Setup font menggunakan `next/font`:
  ```typescript
  // src/app/layout.tsx
  import { Inter } from 'next/font/google'
  const inter = Inter({ subsets: ['latin'] })
  ```
- [ ] Buat global styles di `src/app/globals.css`

### 1.3 Setup Layout & Routing

- [ ] Buat structure folder App Router:
  ```
  src/app/
  ├── layout.tsx                    # Root layout
  ├── page.tsx                      # Landing Page (lihat Fase 1.4)
  ├── loading.tsx                   # Global loading fallback
  ├── error.tsx                     # Global error boundary
  ├── not-found.tsx                 # Custom 404
  ├── (auth)/
  │   ├── login/page.tsx
  │   └── register/page.tsx
  ├── dashboard/
  │   ├── layout.tsx                # Dashboard layout (sidebar/nav)
  │   ├── loading.tsx               # Dashboard loading skeleton
  │   ├── error.tsx                 # Dashboard error boundary
  │   ├── page.tsx                  # Dashboard home
  │   ├── workers/
  │   │   ├── page.tsx              # Worker management
  │   │   ├── loading.tsx
  │   │   └── error.tsx
  │   └── containers/
  │       ├── page.tsx              # Container list
  │       ├── loading.tsx
  │       ├── error.tsx
  │       └── [containerId]/
  │           ├── page.tsx          # Order management
  │           ├── loading.tsx
  │           └── history/page.tsx  # Order DONE/ARCHIVED
  └── q/
      └── [username]/
          └── [gameCode]/
              ├── page.tsx          # Public queue page
              └── loading.tsx
  ```

  > **Catatan:** Manfaatkan `loading.tsx` dan `error.tsx` bawaan Next.js App Router per route segment. Lebih clean daripada handle loading/error di dalam komponen masing-masing.

### 1.4 Landing Page (`/`)

- [ ] Buat halaman landing sederhana yang menjelaskan produk — **jangan redirect langsung ke `/login`**. Halaman ini adalah showcase pertama untuk recruiter dan calon user.
- [ ] Konten minimal landing page:
  - Hero section: tagline + CTA tombol "Mulai Gratis" → `/register`
  - Fitur unggulan: Public Queue Link, Kelola Worker, Real-time Status
  - Tombol "Login" di navbar untuk yang sudah punya akun
- [ ] Desain ini adalah kesan pertama portfolio — pastikan visual menarik

---

## Fase 2: Halaman Authentication

### 2.1 Halaman Registrasi (`/register`)

- [ ] Buat form registrasi dengan field:
  - Username (input text)
  - Email (input email)
  - Password (input password, dengan toggle show/hide)
  - **Honeypot field** — hidden input, `aria-hidden`, `tabIndex={-1}`, `autocomplete="off"`, style `display: none`
- [ ] Integrasikan **Cloudflare Turnstile** widget:
  ```bash
  npm install @marsidev/react-turnstile
  ```
  - Letakkan sebelum tombol submit
  - Kirim token bersama form data ke API
- [ ] Validasi client-side:
  - Username: min 3 karakter, hanya huruf kecil, angka, dan dash
  - Email: format valid
  - Password: min 8 karakter
- [ ] Tampilkan error message yang user-friendly
- [ ] Loading state pada tombol submit
- [ ] Link ke halaman login: *"Sudah punya akun? Login"*

### 2.2 Halaman Login (`/login`)

- [ ] Buat form login dengan field:
  - Username (input text)
  - Password (input password)
- [ ] Setelah login sukses: redirect ke `/dashboard`
- [ ] Tampilkan error jika username/password salah
- [ ] Link ke halaman registrasi: *"Belum punya akun? Daftar"*

### 2.3 Auth State Management

- [ ] Buat custom hook `useAuth()`:
  - Cek status login (cookie based)
  - Return `{ user, isLoading, isAuthenticated }`
- [ ] Buat komponen `AuthGuard`:
  - Wrap halaman dashboard
  - Redirect ke `/login` jika belum login
  - Tampilkan loading skeleton saat mengecek auth

---

## Fase 3: Dashboard Layout

### 3.1 Navigation

- [ ] Buat **Mobile Bottom Navigation** (tampil di layar < 768px):
  - Icon tabs: Dashboard, Workers, Containers
  - Active state indicator
  - Sticky bottom
- [ ] Buat **Sidebar Navigation** (tampil di layar >= 768px):
  - Logo/Brand di atas
  - Menu items: Dashboard, Workers, Containers
  - Active state highlight
  - Tombol logout di bagian bawah
- [ ] Buat **Top Bar**:
  - Tampilkan username owner
  - Dropdown menu: Profile, Logout

### 3.2 Dashboard Home (`/dashboard`)

- [ ] Tampilkan summary cards:
  - Total Workers aktif
  - Total Containers
  - Total Order aktif (semua container)
  - Total Order selesai hari ini
- [ ] Quick links ke container yang aktif
- [ ] Tampilkan nama owner sebagai greeting: *"Selamat datang, {username}"*

---

## Fase 4: Worker Management Page

### 4.1 Worker List (`/dashboard/workers`)

- [ ] Tampilkan daftar worker dalam bentuk **card list** (mobile-friendly):
  - Nama worker
  - Tanggal ditambahkan
  - Tombol Edit (icon pensil)
  - Tombol Hapus (icon trash, warna merah)
- [ ] Tampilkan **counter**: `{jumlah}/20 Worker`
- [ ] Jika sudah 20 worker: disable tombol "Tambah Worker" dan tampilkan pesan batas

### 4.2 Tambah Worker

- [ ] Tombol "Tambah Worker" di pojok kanan atas
- [ ] Dialog/modal dengan input nama worker
- [ ] Validasi: nama tidak boleh kosong, max 50 karakter
- [ ] Setelah berhasil: tutup modal, refresh list, tampilkan toast sukses

### 4.3 Edit Worker

- [ ] Klik tombol edit → buka dialog dengan input yang sudah terisi nama saat ini
- [ ] Simpan perubahan → refresh list → toast sukses

### 4.4 Hapus Worker

- [ ] Klik tombol hapus → tampilkan **Alert Dialog** konfirmasi:
  - *"Yakin ingin menghapus worker {nama}? Order yang ditugaskan ke worker ini akan kehilangan assignment-nya."*
- [ ] Setelah konfirmasi → hapus → refresh list → toast sukses

---

## Fase 5: Container Management Page

### 5.1 Container List (`/dashboard/containers`)

- [ ] Tampilkan daftar container dalam bentuk **card**:
  - Nama game (dengan icon/emoji game)
  - Game code badge
  - Slug URL dengan **CopyButton**:
    - Klik → icon berubah dari copy menjadi centang (✓)
    - Setelah 2 detik, kembali ke icon copy
    - Tooltip: *"Salin link"* → *"Tersalin!"*
  - Jumlah order aktif: `{n} order aktif`
  - **Toggle switch** Active/Hide
  - Tombol "Kelola Order" → navigasi ke halaman order container
  - Tombol "Hapus" (icon trash, warna merah)
- [ ] Tampilkan **counter**: `{jumlah}/5 Container`
- [ ] Jika sudah 5 container: disable tombol "Buat Container" dan tampilkan pesan batas

### 5.2 Buat Container

- [ ] Tombol "Buat Container" di pojok kanan atas
- [ ] Dialog/modal:
  - Dropdown/select untuk memilih game (dari `GAME_LIST`)
  - Game yang sudah dipakai di-disable dengan label *(sudah ada)*
  - Preview slug yang akan di-generate: `/q/{username}/{game_code}`
- [ ] Setelah berhasil: tutup modal, refresh list, toast sukses

### 5.3 Toggle Active

- [ ] Klik switch → update status `is_active` via API
- [ ] Visual feedback: card menjadi semi-transparan jika `is_active = false`
- [ ] Toast: *"Antrean {game} diaktifkan"* / *"Antrean {game} dinonaktifkan"*

### 5.4 Hapus Container

- [ ] Klik tombol hapus → **Alert Dialog konfirmasi dua langkah**:
  - Langkah 1: *"Yakin ingin menghapus container {game}? Semua data order akan ikut terhapus."*
  - Langkah 2: Ketik nama game untuk konfirmasi (misal ketik `MLBB` untuk konfirmasi)
- [ ] Setelah konfirmasi kedua → hapus → refresh list → toast sukses

---

## Fase 6: Order Management Page

### 6.1 Order List (`/dashboard/containers/[containerId]`)

- [ ] Buat **dua section** pada halaman:
  - **Section PROGRESS** (paling atas)
    - Background warna aksen (misal kuning/oranye muda)
    - Judul: `🔄 Sedang Dikerjakan ({count})`
    - Card per order:
      - Nomor antrian (badge besar)
      - Nama customer (full, tidak disensor — hanya owner yang lihat ini)
      - Detail pesanan
      - Nama worker yang ditugaskan
      - Waktu masuk
      - Tombol **"Selesai"** (hijau) → ubah ke DONE
  - **Section QUEUE** (di bawah)
    - Judul: `⏳ Menunggu ({count})`
    - Card per order:
      - Nomor antrian
      - Nama customer (full)
      - Detail pesanan
      - Nama worker
      - Waktu masuk
      - Tombol **"Proses"** (biru) → ubah ke PROGRESS
      - Tombol **"Hapus"** (merah, icon trash)

- [ ] Integrasikan **Supabase Realtime** di halaman ini juga — bukan hanya di public page. Gunakan hook `useRealtimeQueue(containerId)` yang sama agar tampilan dashboard owner terupdate otomatis tanpa refresh saat ada perubahan.
- [ ] Tampilkan **counter order aktif**: `{jumlah}/50 Order Aktif`
- [ ] Tombol navigasi ke **Riwayat** (halaman DONE & ARCHIVED)

### 6.2 Tambah Order

- [ ] Tombol **"+ Tambah Order"** (floating action button di mobile, atau tombol biasa di desktop)
- [ ] Dialog/modal input order:
  - **Nama Customer (IGN)** — text input, wajib
  - **Detail Pesanan** — textarea (rank target, paket layanan, dll)
  - **Pilih Worker** — dropdown/select list worker milik owner
- [ ] Validasi:
  - Nama customer wajib, max 100 karakter
  - Detail opsional, max 500 karakter
  - Worker wajib dipilih
- [ ] Jika sudah 50 order aktif: disable tombol tambah, tampilkan pesan batas
- [ ] Setelah berhasil: tutup modal, refresh list, toast sukses
- [ ] **Penting:** `queue_number` adalah tanggung jawab server — frontend hanya submit form dan menampilkan nomor yang dikembalikan dari response API. Jangan ada logika increment di sisi client.

### 6.3 Aksi Status Order

- [ ] Tombol **"Proses"** (QUEUE → PROGRESS):
  - Klik → konfirmasi ringan (bisa tanpa dialog, langsung proses)
  - Order pindah ke section PROGRESS di atas
  - Animasi transisi yang smooth
- [ ] Tombol **"Selesai"** (PROGRESS → DONE):
  - Klik → konfirmasi ringan
  - Order hilang dari halaman aktif, masuk ke Riwayat
  - Toast: *"Order #{no} selesai!"*
- [ ] Tombol **"Hapus"** (Permanent Delete):
  - Alert Dialog konfirmasi: *"Yakin hapus order #{no} secara permanen?"*
  - Setelah konfirmasi → hapus → refresh

### 6.4 Riwayat Order (`/dashboard/containers/[containerId]/history`)

- [ ] Buat halaman terpisah menggunakan **Tabs**:
  - Tab **DONE** — order yang sudah selesai
  - Tab **ARCHIVED** — order yang sudah diarsipkan
- [ ] Tampilkan per order:
  - Nomor antrian
  - Nama customer
  - Worker yang mengerjakan
  - Tanggal selesai (`updated_at`)
  - Status badge
- [ ] Aksi pada order DONE:
  - Tombol **"Arsipkan"** → ubah ke ARCHIVED
- [ ] Aksi pada order ARCHIVED:
  - Tombol **"Aktifkan Kembali"** → ubah ke QUEUE (cek batas 50 order aktif dulu)
  - Tombol **"Hapus Permanen"**
- [ ] Tampilkan info batas: `{jumlah}/200 Riwayat`

---

## Fase 7: Public Queue Page

### 7.1 Halaman Publik (`/q/[username]/[gameCode]`)

- [ ] **Desain mobile-first** — ini halaman utama yang dilihat customer
- [ ] **Tidak ada navigasi dashboard** — halaman ini standalone
- [ ] Desain yang clean dan profesional:
  - Header:
    - Nama store/owner (berdasarkan username)
    - Nama game
    - Badge status: "🟢 Buka" atau "🔴 Tutup"

### 7.2 Summary Stats

- [ ] Tampilkan 3 stat cards di atas:
  - **Dalam Antrian** (jumlah status QUEUE)
  - **Sedang Proses** (jumlah status PROGRESS)
  - **Selesai Hari Ini** (jumlah status DONE hari ini)
- [ ] Gunakan warna yang berbeda per stat untuk visual distinction

### 7.3 Daftar Antrian

- [ ] Tampilkan tabel/list antrian:

  | Kolom | Format |
  |-------|--------|
  | No. Antrian | Angka (misal: #1, #2, #3) |
  | Nama | **Sudah disensor dari server** — frontend hanya tampilkan apa yang diterima dari API |
  | Waktu Masuk | Format relatif: *"2 jam lalu"* atau absolute: *"05 Apr, 14:30"* |
  | Status | Badge berwarna |

  > **Penting:** Nama customer sudah disensor di sisi server sebelum dikirim ke client (format `iz***i`). Frontend **tidak perlu dan tidak boleh** melakukan sensor di sisi client. Jangan pernah fetch nama asli lalu sensor di frontend — data asli bisa terlihat di DevTools Network tab.

- [ ] Status badge styling:
  - `QUEUE` → Badge abu-abu/putih: *"Menunggu"*
  - `PROGRESS` → Badge kuning/oranye: *"Dikerjakan"*
  - `DONE` → Badge hijau: *"Selesai"*
- [ ] Urutkan: PROGRESS di atas, lalu QUEUE, lalu DONE
- [ ] Jangan tampilkan order ARCHIVED

### 7.4 Handling Container Tidak Aktif & Tidak Ditemukan

- [ ] Jika `is_active = false` (API return status `closed`), tampilkan halaman khusus:
  - Ilustrasi/icon yang sesuai (misal icon toko tutup)
  - Teks: *"Antrean sedang tutup"*
  - Subjudul: *"Silakan hubungi pemilik untuk informasi lebih lanjut"*
  - **BUKAN halaman 404**
- [ ] Jika slug tidak ditemukan di database (API return 404), tampilkan halaman khusus:
  - Teks: *"Toko tidak ditemukan"*
  - Subjudul: *"Pastikan link yang kamu buka sudah benar"*
  - **Buat komponen terpisah** dari halaman 404 generik — pesan harus kontekstual

### 7.5 Realtime Update

- [ ] Integrasikan **Supabase Realtime** untuk auto-update:
  ```typescript
  // src/hooks/useRealtimeQueue.ts
  import { supabase } from '@/lib/supabase-client'

  export function useRealtimeQueue(containerId: string) {
    useEffect(() => {
      const channel = supabase
        .channel(`queue-${containerId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `container_id=eq.${containerId}`
        }, (payload) => {
          // Refresh data saat ada perubahan
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }, [containerId])
  }
  ```
- [ ] Saat ada update: refresh tampilan tanpa full page reload
- [ ] Tambahkan subtle animation saat status berubah (misal flash highlight)

### 7.6 SEO & Open Graph untuk Public Page

- [ ] Set metadata dinamis per halaman:
  ```typescript
  export async function generateMetadata({ params }) {
    return {
      title: `Antrian ${gameName} — ${username}`,
      description: `Cek status antrian joki ${gameName} secara real-time`,
      openGraph: {
        title: `Antrian ${gameName} — ${username}`,
        description: `Cek status antrian joki ${gameName} secara real-time`,
        type: 'website',
      }
    }
  }
  ```
- [ ] Gunakan SSR (`fetch` di server component) untuk initial data
- [ ] Set Open Graph tags untuk share preview yang bagus di WhatsApp dan media sosial — link ini yang akan dipajang di bio Instagram/TikTok owner, pastikan preview-nya menarik

---

## Fase 8: Komponen Reusable

### 8.1 Komponen UI Umum

- [ ] `StatusBadge` — Badge berwarna berdasarkan status order
  ```tsx
  <StatusBadge status="QUEUE" />     // Abu-abu
  <StatusBadge status="PROGRESS" />  // Kuning/Oranye
  <StatusBadge status="DONE" />      // Hijau
  <StatusBadge status="ARCHIVED" />  // Biru muda
  ```
- [ ] `StatCard` — Card ringkasan statistik dengan icon, label, dan angka
- [ ] `ConfirmDialog` — Dialog konfirmasi yang reusable (satu langkah dan dua langkah)
- [ ] `EmptyState` — Placeholder saat tidak ada data (dengan ilustrasi)
- [ ] `LoadingSkeleton` — Skeleton loader untuk setiap halaman/section
- [ ] `CopyButton` — Tombol copy-to-clipboard dengan behavior:
  - Default: icon copy + tooltip *"Salin link"*
  - Setelah klik: icon berubah ke centang (✓) + tooltip *"Tersalin!"*
  - Setelah 2 detik: kembali ke state semula
- [ ] `OrderCard` — Card order yang dipakai di dashboard dan public page
- [ ] `ClosedQueuePage` — Komponen halaman "Antrean sedang tutup"
- [ ] `NotFoundQueue` — Komponen halaman "Toko tidak ditemukan" (berbeda dari 404 generik)

### 8.2 Custom Hooks

- [ ] `useAuth()` — State autentikasi
- [ ] `useWorkers()` — CRUD workers dengan state management
- [ ] `useContainers()` — CRUD containers dengan state management
- [ ] `useOrders(containerId)` — CRUD orders + status transition
- [ ] `useRealtimeQueue(containerId)` — Realtime subscription, **dipakai di dashboard owner dan public page**
- [ ] `useToast()` — Notifikasi toast (sudah ada dari shadcn/ui)

---

## Fase 9: Responsive Design & Polish

### 9.1 Mobile-First Checklist

- [ ] Semua halaman didesain untuk tampilan mobile terlebih dahulu (min-width: 320px)
- [ ] Breakpoints:
  - `< 768px` → Mobile layout (single column, bottom nav)
  - `>= 768px` → Tablet layout (side nav, wider cards)
  - `>= 1024px` → Desktop layout (side nav, multi-column grid)
- [ ] Touch targets: minimal 44x44px untuk semua tombol dan link
- [ ] Form inputs: gunakan `font-size: 16px` atau lebih (mencegah zoom di iOS)

### 9.2 Animasi & Micro-interactions

- [ ] **Page transitions** — smooth fade/slide saat navigasi
- [ ] **Card hover effects** — subtle shadow/scale pada desktop
- [ ] **Status change animation** — flash/highlight saat status order berubah di public page
- [ ] **Button loading states** — spinner pada tombol saat memproses request
- [ ] **Toast notifications** — slide-in dari pojok kanan atas
- [ ] **Skeleton loading** — pulse animation saat data sedang dimuat

### 9.3 Error States

- [ ] Halaman 404 custom — *"Halaman tidak ditemukan"* (generik)
- [ ] Error boundary menggunakan `error.tsx` per route segment
- [ ] Tampilkan retry button jika API gagal
- [ ] Offline indicator (opsional)

---

## Fase 10: Testing & QA

### 10.1 Component Testing

- [ ] Test render setiap komponen reusable
- [ ] Test form validation (registrasi, login, tambah order)
- [ ] Test status badge warna sesuai status
- [ ] Test `CopyButton` — pastikan state berubah dan kembali setelah 2 detik

### 10.2 User Flow Testing

- [ ] **Flow Registrasi:** Buka `/register` → isi form → submit → diarahkan ke `/dashboard`
- [ ] **Flow Login:** Buka `/login` → isi form → submit → diarahkan ke `/dashboard`
- [ ] **Flow Worker:** Dashboard → Workers → Tambah → Edit → Hapus
- [ ] **Flow Container:** Dashboard → Container → Buat → Toggle Active → Hapus
- [ ] **Flow Order:** Container → Tambah Order → Proses → Selesai → Arsip
- [ ] **Flow Public:** Buka `/q/{username}/{game}` → lihat antrean → realtime update
- [ ] **Flow Edge Case:** Buka slug tidak aktif → tampil halaman "Antrean sedang tutup"
- [ ] **Flow Edge Case:** Buka slug tidak ada → tampil halaman "Toko tidak ditemukan"

### 10.3 Responsive Testing

- [ ] Test di viewport 320px (iPhone SE)
- [ ] Test di viewport 375px (iPhone 12)
- [ ] Test di viewport 768px (iPad)
- [ ] Test di viewport 1024px (Laptop)
- [ ] Test di viewport 1440px (Desktop)

---

## Ringkasan Halaman Frontend

| # | Route | Tipe | Deskripsi |
|---|-------|------|-----------|
| 1 | `/` | Public | Landing page produk + CTA |
| 2 | `/register` | Public | Form registrasi owner |
| 3 | `/login` | Public | Form login owner |
| 4 | `/dashboard` | Private | Dashboard home + summary |
| 5 | `/dashboard/workers` | Private | Kelola worker |
| 6 | `/dashboard/containers` | Private | Kelola container |
| 7 | `/dashboard/containers/[id]` | Private | Kelola order dalam container |
| 8 | `/dashboard/containers/[id]/history` | Private | Riwayat order (DONE/ARCHIVED) |
| 9 | `/q/[username]/[gameCode]` | Public | Halaman antrian publik (customer) |
| 10 | `/404` | Public | Halaman not found generik |

---

## Catatan Penting untuk Tim Frontend

> [!IMPORTANT]
> **Mobile-First:** Pelanggan joki mayoritas mengakses via smartphone. Semua halaman **WAJIB** terlihat bagus dan fungsional di layar kecil (320px ke atas).

> [!WARNING]
> **Nama customer sudah disensor di server.** Frontend hanya menampilkan data yang diterima dari API — jangan fetch nama asli lalu sensor di frontend. Data asli yang dikirim ke browser bisa terlihat via DevTools.

> [!WARNING]
> **`queue_number` adalah tanggung jawab server.** Jangan ada logika auto-increment di sisi client. Frontend cukup submit form dan tampilkan nomor dari response API.

> [!TIP]
> **Prioritas pengerjaan:** Fase 1 (Setup + Landing) → Fase 2 (Auth) → Fase 4 (Workers) → Fase 5 (Containers) → Fase 6 (Orders) → Fase 7 (Public Page) → Fase 8 (Komponen) → Fase 9 (Polish). Fase 3 dikerjakan di awal sebagai fondasi layout.

> [!NOTE]
> **Koordinasi dengan backend:** Pastikan format request/response API sudah disepakati sebelum mulai integrasi. Gunakan mock data saat backend belum siap.