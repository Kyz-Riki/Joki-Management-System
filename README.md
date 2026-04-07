# Joki Management System

A queue management platform for game boosting ("joki") service owners. Built with Next.js 16, Supabase, Drizzle ORM, and shadcn/ui.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui |
| Backend | Next.js API Routes |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| ORM | Drizzle ORM |
| Realtime | Supabase Realtime |
| Hosting | Vercel |

## Features

- **Owner Dashboard** — manage workers, game queues, and orders
- **Worker Management** — add up to 20 workers per account
- **Container Management** — create queue pages per game (max 5), each with a unique public URL
- **Order Management** — full status flow: Queue → Progress → Done → Archived
- **Public Queue Page** — shareable link for customers to check their queue status, with censored names for privacy
- **Anti-abuse** — Cloudflare Turnstile CAPTCHA, IP-based rate limiting, honeypot field

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) site (for production)

### 1. Clone & Install

```bash
git clone <repo-url>
cd <project-dir>
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and set:

| Variable | Where to find it |
|---|---|
| `DATABASE_URL` | Supabase Dashboard → Settings → Database → Connection string (Transaction pooler, port 6543) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` key (**keep secret!**) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Dashboard → Turnstile → Site Key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Dashboard → Turnstile → Secret Key |
| `CRON_SECRET` | Any random secret string (e.g. `openssl rand -hex 32`) |

### 3. Set Up the Database

Run the migration SQL in your **Supabase SQL Editor**:

1. Go to Supabase Dashboard → SQL Editor
2. Open and run `supabase/migrations/001_initial_schema.sql`

This creates all tables, indexes, triggers, and Row Level Security policies.

### 4. Enable Supabase Realtime

In your Supabase Dashboard:
1. Go to **Database → Replication**
2. Enable **Realtime** on the `orders` table

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & Register pages
│   ├── api/             # API Routes (backend)
│   │   ├── auth/        # register, login, logout
│   │   ├── workers/     # CRUD workers
│   │   ├── containers/  # CRUD containers + orders
│   │   ├── games/       # Available games list
│   │   ├── public/      # Public queue endpoint
│   │   └── cron/        # Auto-archive cron job
│   ├── dashboard/       # Protected owner dashboard
│   └── q/               # Public queue pages (/q/[username]/[game])
├── db/
│   ├── schema.ts        # Drizzle ORM table definitions
│   └── index.ts         # Database connection
└── lib/
    ├── api.ts           # Frontend API client (fetch wrappers)
    ├── auth.ts          # Auth helpers (getCurrentOwner, assertOwnership)
    ├── constants.ts     # GAME_LIST enum
    ├── db-helpers.ts    # Count query helpers
    ├── errors.ts        # Error classes + handleApiError
    ├── response.ts      # ok() / err() response helpers
    ├── validations.ts   # Zod schemas
    └── supabase/
        ├── client.ts    # Browser Supabase client
        └── server.ts    # Server Supabase client + service client
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new owner |
| `POST` | `/api/auth/login` | ❌ | Login |
| `POST` | `/api/auth/logout` | ✅ | Logout |
| `GET` | `/api/workers` | ✅ | List workers |
| `POST` | `/api/workers` | ✅ | Add worker |
| `PUT` | `/api/workers/[id]` | ✅ | Update worker |
| `DELETE` | `/api/workers/[id]` | ✅ | Delete worker |
| `GET` | `/api/containers` | ✅ | List containers |
| `POST` | `/api/containers` | ✅ | Create container |
| `PATCH` | `/api/containers/[id]/toggle` | ✅ | Toggle active/inactive |
| `DELETE` | `/api/containers/[id]` | ✅ | Delete container |
| `GET` | `/api/games` | ❌ | List available games |
| `GET` | `/api/containers/[cId]/orders` | ✅ | List orders |
| `POST` | `/api/containers/[cId]/orders` | ✅ | Create order |
| `PATCH` | `/api/containers/[cId]/orders/[oId]/status` | ✅ | Update order status |
| `DELETE` | `/api/containers/[cId]/orders/[oId]` | ✅ | Delete order |
| `GET` | `/api/public/queue/[username]/[gameCode]` | ❌ | Public queue data |
| `POST` | `/api/cron/auto-archive` | 🔑 | Auto-archive old orders |

## Deployment

### Vercel

1. Push to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy

The cron job (`/api/cron/auto-archive`) runs automatically at 02:00 UTC daily via `vercel.json`.

### Database Schema Push (alternative to SQL editor)

If you prefer using Drizzle Kit to push the schema:

```bash
npx drizzle-kit push
```

## Security Notes

- **Never expose** `SUPABASE_SERVICE_ROLE_KEY` to the browser (not `NEXT_PUBLIC_`)
- **Never store** customer game account credentials in this system
- The public queue page censors customer names server-side before sending to clients
- `assertOwnership()` is called on every mutating endpoint to prevent BOLA attacks