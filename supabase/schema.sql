-- Run this in the Supabase SQL editor to set up the schema.
-- All tables use the authenticated user's ID from auth.uid() for row-level security.

-- Enable UUID extension (already enabled by default in Supabase)
-- create extension if not exists "uuid-ossp";

-- ─── Gear Items ───────────────────────────────────────────────────────────────
create table if not exists gear_items (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  category      text not null,
  weight        numeric not null default 0,
  notes         text,
  created_date  timestamptz not null default now()
);

alter table gear_items enable row level security;

create policy "Users manage their own gear"
  on gear_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Trips ────────────────────────────────────────────────────────────────────
create table if not exists trips (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  start_date       text not null,
  end_date         text not null,
  route            text,
  distance         numeric,
  elevation        numeric,
  notes            text,
  itinerary_email  text,
  packing_list_id  text not null,
  created_date     timestamptz not null default now()
);

alter table trips enable row level security;

create policy "Users manage their own trips"
  on trips for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Packing Lists ────────────────────────────────────────────────────────────
create table if not exists packing_lists (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  trip_id       text not null references trips(id) on delete cascade,
  created_date  timestamptz not null default now()
);

alter table packing_lists enable row level security;

create policy "Users manage their own packing lists"
  on packing_lists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Packing List Items ───────────────────────────────────────────────────────
create table if not exists packing_list_items (
  id               text primary key,
  user_id          uuid not null references auth.users(id) on delete cascade,
  packing_list_id  text not null references packing_lists(id) on delete cascade,
  gear_item_id     text not null references gear_items(id) on delete cascade,
  is_packed        boolean not null default false,
  quantity         integer not null default 1,
  custom_weight    numeric,
  created_date     timestamptz not null default now()
);

alter table packing_list_items enable row level security;

create policy "Users manage their own packing list items"
  on packing_list_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Emergency Contacts ───────────────────────────────────────────────────────
create table if not exists emergency_contacts (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  trip_id       text not null references trips(id) on delete cascade,
  name          text not null,
  phone         text not null,
  relationship  text not null,
  created_date  timestamptz not null default now()
);

alter table emergency_contacts enable row level security;

create policy "Users manage their own emergency contacts"
  on emergency_contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
