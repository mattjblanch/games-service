# Game Service Starter (Next.js + Supabase)

A tiny, mobile-first multiplayer shell featuring **Tic-Tac-Toe** as the first game. Built with Next.js App Router, Tailwind, and Supabase (Auth + Postgres + Realtime).

## Quickstart

1) **Create Supabase project** and enable **Email OTP (magic link)** auth.
2) In the SQL Editor, run the contents of [`supabase.sql`](./supabase.sql).
3) Copy `.env.local.example` to `.env.local` and fill in your Supabase URL + ANON key.

```bash
npm install
npm run dev
```

Open http://localhost:3000

### How to play
- Go to the home page, log in via magic link.
- Click **Create match** on Tic-Tac-Toe; share the room URL with a friend.
- Second player opens the link, auto-joins as O. Play in realtime.

## Add a new game later
Create `src/games/<new-game>/{engine.ts, ui.tsx, meta.ts}` and register it in `src/games/index.ts`. The room shell is generic and can be adapted to route events/state to the specific game.

## Notes
- Minimal RLS is included; adjust to your needs.
- Realtime uses Supabase broadcast channels.
- This starter avoids shadcn/ui to keep deps tiny; you can add it later.
