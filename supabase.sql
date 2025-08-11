-- Run this in the Supabase SQL editor

create extension if not exists pgcrypto;

-- Profiles tie to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  wins integer default 0,
  losses integer default 0,
  created_at timestamptz default now()
);

-- Automatically create a profile entry for new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Games metadata
create table if not exists public.games (
  slug text primary key,
  name text not null
);

insert into public.games (slug, name)
values ('tic-tac-toe', 'Tic-Tac-Toe')
on conflict (slug) do nothing;

-- Matches represent a room
do $$
begin
  if not exists (select 1 from pg_type where typname = 'match_status') then
    create type match_status as enum ('waiting','active','finished');
  end if;
end $$;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  game_slug text not null references public.games(slug),
  created_by uuid not null references public.profiles(id),
  player_x uuid references public.profiles(id),
  player_o uuid references public.profiles(id),
  status match_status not null default 'waiting',
  current_turn text check (current_turn in ('X','O')) default 'X',
  winner text check (winner in ('X','O','draw')),
  snapshot text check (length(snapshot) = 9) default '.........',
  created_at timestamptz default now()
);

-- Moves history (optional)
create table if not exists public.moves (
  id bigserial primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  player uuid not null references public.profiles(id),
  symbol text check (symbol in ('X','O')) not null,
  cell smallint check (cell between 0 and 8) not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.moves enable row level security;

create policy "profiles: self-viewable" on public.profiles
for select using (auth.uid() = id);

create policy "profiles: insert own" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles: update all" on public.profiles
for update using (true) with check (true);

create policy "matches: read all" on public.matches
for select using (true);

create policy "matches: create" on public.matches
for insert with check (auth.uid() = created_by);

create policy "matches: update if participant or waiting" on public.matches
for update using (
  status = 'waiting' or auth.uid() in (player_x, player_o, created_by)
);

create policy "matches: delete if participant or waiting" on public.matches
for delete using (
  status = 'waiting' or auth.uid() in (player_x, player_o, created_by)
);

create policy "moves: read all" on public.moves
for select using (true);

create policy "moves: insert if participant" on public.moves
for insert with check (
  auth.uid() in (
    select player_x from public.matches where id = match_id
  ) or auth.uid() in (
    select player_o from public.matches where id = match_id
  )
);
