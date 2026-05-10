-- ============================================================
-- Link Monetization Platform – Supabase Schema
-- Run this in the Supabase SQL editor
-- ============================================================

create extension if not exists "pgcrypto";

-- Tasks: affiliate offers users can complete
create table tasks (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  affiliate_url   text,
  payout_estimate numeric default 0,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- Links: each slug maps to a destination URL
create table links (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text unique not null,
  destination_url text not null,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- Many-to-many: which tasks are assigned to which links
create table link_tasks (
  id              uuid primary key default gen_random_uuid(),
  link_id         uuid references links(id) on delete cascade,
  task_id         uuid references tasks(id) on delete cascade,
  sort_order      int default 0,
  is_recommended  boolean default false,
  unique(link_id, task_id)
);

-- Sessions: one row per user attempt
create table sessions (
  id          uuid primary key default gen_random_uuid(),
  session_id  text unique not null,
  link_id     uuid references links(id),
  task_id     uuid references tasks(id),
  ip_address  text,
  status      text default 'pending',
  created_at  timestamptz default now(),
  expires_at  timestamptz,
  used_at     timestamptz
);

-- Analytics events: page_view, task_selected, task_started, task_completed
create table analytics_events (
  id          uuid primary key default gen_random_uuid(),
  link_id     uuid references links(id),
  task_id     uuid references tasks(id),
  event_type  text not null,
  ip_address  text,
  created_at  timestamptz default now()
);

-- Indexes
create index on links(slug);
create index on sessions(session_id);
create index on sessions(link_id, ip_address, created_at);
create index on analytics_events(link_id, created_at);
create index on analytics_events(task_id, created_at);
create index on analytics_events(event_type, created_at);

-- ============================================================
-- Row Level Security
-- All server-side queries use the service_role key which
-- bypasses RLS. Disable anon access to sensitive tables.
-- ============================================================

alter table links           enable row level security;
alter table tasks           enable row level security;
alter table link_tasks      enable row level security;
alter table sessions        enable row level security;
alter table analytics_events enable row level security;

-- No policies = anon key gets nothing. Service role bypasses RLS.
