create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  mobile_number text not null,
  address text not null,
  gender text not null,
  date_of_birth date not null,
  profile_picture text,
  bio text,
  category_niche text,
  location text,
  languages text[] not null default '{}',
  audience_demographics jsonb not null default '{}'::jsonb,
  rate_card numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_category_niche on public.users (category_niche);
create index if not exists idx_users_location on public.users (location);
