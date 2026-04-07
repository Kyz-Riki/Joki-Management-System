<div align="center">
  <h1>🎮 Joki Management System</h1>
  <p>Platform manajemen antrean cerdas untuk pemilik layanan "joki" (game boosting).</p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" /></a>
    <a href="https://reactjs.org/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
    <a href="https://orm.drizzle.team/"><img src="https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black" alt="Drizzle ORM" /></a>
  </p>
</div>

---

## 🌟 Tentang Proyek Ini

**Joki Management System** dirancang khusus untuk membantu pemilik jasa _game boosting_ (joki) dalam mengelola pesanan, pekerja (worker), dan antrean dengan lebih profesional. Platform ini menyediakan halaman publik (antrean real-time) yang dapat dibagikan kepada pelanggan untuk mengecek status joki mereka tanpa perlu bertanya secara manual.

## ✨ Fitur Utama

- 📊 **Dashboard Pemilik Jasa (Owner)** — Kelola worker, antrean per game, dan pantau seluruh status pesanan dengan mudah.
- 👥 **Manajemen Pekerja (Worker)** — Tambahkan hingga 20 akun worker (pekerja booster) dalam satu naungan akun pemilik.
- 📦 **Manajemen Kontainer (Container)** — Buat halaman antrean khusus per game (maks. 5 game), masing-masing dengan URL publik shareable yang unik.
- 🛒 **Manajemen Siklus Pesanan (Order flow)** — Alur status pesanan yang lengkap dan terstruktur: `Antrean (Queue)` → `Diproses (Progress)` → `Selesai (Done)` → `Diarsipkan (Archived)`.
- 🔗 **Halaman Antrean Publik** — URL publik yang bisa dibagikan kepada pelanggan untuk memantau status pesanan mereka secara real-time (lengkap dengan penyensoran nama IGN demi keamanan privasi pelanggan).
- 🛡️ **Keamanan & Anti-Abuse** — Dilengkapi dengan _Cloudflare Turnstile CAPTCHA_, serta sistem pencegahan spam dan bot terintegrasi.

## 🧰 Tech Stack

| Kategori | Teknologi Utama |
|---|---|
| **Frontend** | Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL (Dikelola dengan Supabase) |
| **Autentikasi** | Supabase Auth |
| **ORM** | Drizzle ORM |
| **Realtime** | Supabase Realtime |
| **Deployment** | Vercel |

## 🚀 Panduan Memulai (Getting Started)

### Persyaratan Sistem

- **Node.js** versi 18 atau lebih baru.
- Akun dan Proyek [Supabase](https://supabase.com).
- Akun Cloudflare untuk mengakses fitur [Turnstile](https://developers.cloudflare.com/turnstile/) (direkomendasikan untuk _production_).

### 1. Kloning Repositori & Instalasi

```bash
git clone https://github.com/Kyz-Riki/Joki-Management-System.git
cd Joki-Management-System
npm install
```

### 2. Konfigurasi Environment Variables (Variabel Lingkungan)

Salin file contoh konfigurasi dan lengkapi dengan kredensial milik Anda sendiri:

```bash
cp .env.example .env.local
```

Buka file `.env.local` dan isi nilainya berdasarkan tabel rujukan di bawah ini:

| Variabel | Lokasi Mendapatkan Nilainya |
|---|---|
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Connection string (Transaction pooler, gunakan port `6543`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` key (**Wajib dirahasiakan! Jangan bocor ke publik!**) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Dashboard → Turnstile → Site Key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Dashboard → Turnstile → Secret Key |
| `CRON_SECRET` | Kunci rahasia acak (contoh: hasil eksekusi terminal `openssl rand -hex 32`) |

### 3. Setup Database (Supabase)

Jalankan perintah migrasi SQL berikut ke dalam kotak **SQL Editor** pada Supabase:

1. Buka Supabase Dashboard → **SQL Editor**.
2. Salin dan jalankan seluruh baris kode pada file `supabase/migrations/001_initial_schema.sql`.

Skrip peluncuran di atas akan otomatis mengeksekusi pembuatan seluruh _tables_, _indexes_, _triggers_, dan kebijakan keamanan database berstandarisasi **Row Level Security (RLS)** yang diwajibkan oleh platform.

### 4. Aktivasi Supabase Realtime

Pada Supabase Dashboard proyek Anda:
1. Masuk ke manu navigasi **Database → Replication**.
2. Aktifkan fitur **Realtime** khusus pada tabel `orders` agar pelanggan dapat memantau pergerakan progres antrean tanpa perlu menyegarkan (_refresh_) halaman secara manual.

### 5. Jalankan Server Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) pada browser Anda untuk menjalankan aplikasi secara lokal dan melakukan testing.

## 📁 Struktur Proyek (Directory Structure)

```text
src/
├── app/
│   ├── (auth)/          # Halaman Login & Registrasi
│   ├── api/             # API Routes (Logika Backend Next.js)
│   │   ├── auth/        # Proses Endpoint Register, login, dan logout
│   │   ├── workers/     # CRUD data pekerja/worker
│   │   ├── containers/  # CRUD kontainer game (beserta pesanan/order di dalamnya)
│   │   ├── games/       # Melayani Daftar list game valid
│   │   ├── public/      # Layanan Endpoint antrean publik
│   │   └── cron/        # Sistem otomatis berjalan belakang layar (Cron job)
│   ├── dashboard/       # Halaman Dashboard GUI utama bersandikan password
│   └── q/               # Halaman Publik untuk Pelanggan (/q/[username]/[game])
├── db/
│   ├── schema.ts        # Definisi struktur skema database diatur dengan Drizzle
│   └── index.ts         # Konfigurasi instatisasi Koneksi DB
└── lib/
    ├── api.ts           # Wrapper Client API perantara antarmuka pengguna
    ├── auth.ts          # Alat Helper Autentikasi (getCurrentOwner, dll)
    ├── constants.ts     # Data Konstanta statis penahan input liar (Data Enum)
    ├── db-helpers.ts    # Bantuan query kompleks SQL ke DB
    ├── errors.ts        # Helper error format API
    ├── response.ts      # Standarisasi Output Respon json
    ├── validations.ts   # Pengecekan skema backend yang bersih dengan Zod
    └── supabase/
        ├── client.ts    # Utilitas instance Supabase untuk interaksi melalui Browser
        └── server.ts    # Utilitas instance Supabase untuk interaksi melalui Server (Next.js server environments)
```

## 🌐 Dokumentasi API internal Endpoint

| Metode | Endpoint | Akses | Deskripsi Fungsi |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | ❌ | Membuat akun Owner baru ke database |
| `POST` | `/api/auth/login` | ❌ | Masuk kredensial Owner |
| `POST` | `/api/auth/logout` | ✅ | Mengakhiri Sesi (Menghapus identitas otentikasi) |
| `GET` | `/api/workers` | ✅ | Menghitung & memberikan daftar Pekerja (Worker) |
| `POST` | `/api/workers` | ✅ | Mencatatkan pekerja baru ke database pengguna |
| `PUT` | `/api/workers/[id]` | ✅ | Pembaruan profil nama detail pekerja |
| `DELETE` | `/api/workers/[id]` | ✅ | Memecat/Hapus akun pekerja dari antrean dashboard |
| `GET` | `/api/containers` | ✅ | Pencarian daftar wadah antrean per seluruh tipe game |
| `POST` | `/api/containers` | ✅ | Menjadwalkan / membuat struktur Container game baru |
| `PATCH` | `/api/containers/[id]/toggle` | ✅ | Switch ketersediaan antrean (Pause queue to pending) |
| `DELETE` | `/api/containers/[id]` | ✅ | Menghapus permanen wadah Container berikut seluruh isinya |
| `GET` | `/api/games` | ❌ | Melist daftar game yang disediakan dan didukung platform |
| `GET` | `/api/containers/[cId]/orders` | ✅ | Menarik array daftar order yang menumpuk di suatu game |
| `POST` | `/api/containers/[cId]/orders` | ✅ | Menyuntikkan _order_ tiket pelanggan terbaru ke antrean |
| `PATCH` | `/api/containers/[cId]/orders/[oId]/status` | ✅ | Edit siklus pengerjaan pesanan |
| `DELETE` | `/api/containers/[cId]/orders/[oId]` | ✅ | Pembatalan fatal / penghapusan mendesak sebuah pesanan |
| `GET` | `/api/public/queue/[username]/[gameCode]`| ❌ | Render data murni yang bisa dilirik oleh sistem anonim publik |
| `POST` | `/api/cron/auto-archive` | 🔑 | Automasi bot pemindah status order kadaluarsa (Job task harian) |

## ☁️ Deployment (Penerapan)

### Menerapkan ke Vercel

1. **Commit & Push** keseluruhan _source code_ Anda sendiri ke repositori Github Anda.
2. Impor proyek Anda langsung dari layar Dashboard [Vercel](https://vercel.com).
3. Salin/Masukkan nilai variabel environtment dari file `.env.local` lokal ke pengaturan environtment Vercel.
4. Klik tombol **Deploy** dan Vercel akan mengatur yang lainnya secara otomatis.

Sistem cron pembersihan otomatis (`/api/cron/auto-archive`) secara dasar (`default`) dikoordinasikan untuk berjalan tanpa campur tangan orang pada jam `02:00 UTC` setiap harinya (konfigurasi bersumber penuh pada file `vercel.json` repositori ini).

### Alternatif Implementasi Skema (Schema Push via Database Tooling)

Selain mengeksekusi _Supabase SQL Editor_, Anda bisa memindahkan dan menyuntikkan skema Drizzle langsung memanfaatkan instrumen sinkronisasi CLI-based milik `Drizzle Kit`.

Jalankan Terminal dan masukan:

```bash
npx drizzle-kit push
```

## 🔒 Catatan Keamanan Proyek

- **BAHAYA KEBOCORAN:** JANGAN PERNAH mengekspos environment `SUPABASE_SERVICE_ROLE_KEY` pada jaringan atau halaman Client / publik (oleh karenanya, _property key_ tesebut tidak memiliki awalan `NEXT_PUBLIC_`).
- Platform CMS ini **dilarang/tidak dirancang** untuk menyimpan kredensial berupa (kata sandi/email login) dari akun gaming milik pelanggan secara langsung pada Database demi meminimalisir risiko apabila terjadi peretasan (_hacking_).
- Halaman Publik sengaja tidak menampilkan wujud asli nama IGN dan info pelanggan. Secara mendasar sistem keamanan backend _Server-Side_ otomatis menyensor/menutupi sebagian dari huruf identitas pelanggan. Langkah ini untuk meningkatkan privasinya sebelum ditransmisikan melintasi interaksi Server ke Client.
- Proteksi mutasi rute API (`assertOwnership()`) diimplementasikan ketat dalam pembaruan/modifikasi data pengguna demi mematahkan risiko serangan *BOLA (Broken Object Level Authorization)* dari penyusup anonim.