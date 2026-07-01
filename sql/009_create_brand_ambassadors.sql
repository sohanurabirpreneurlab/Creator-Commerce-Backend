create extension if not exists pgcrypto;

create table if not exists public.brand_ambassadors (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  status varchar(40) not null default 'ACTIVE',
  ambassador_type varchar(40) not null default 'LONG_TERM',
  source varchar(50) not null default 'ADDED_BY_BRAND',
  assigned_by uuid references public.users(id),
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_ambassadors_status_check check (
    status in ('PENDING', 'ACTIVE', 'PAUSED', 'REMOVED', 'REJECTED')
  ),
  constraint brand_ambassadors_type_check check (
    ambassador_type in ('LONG_TERM', 'CAMPAIGN_BASED', 'EVENT_BASED', 'PRODUCT_BASED')
  ),
  constraint brand_ambassadors_source_check check (
    source in ('INVITED_BY_BRAND', 'ADDED_BY_SUPERADMIN', 'CREATOR_REQUESTED', 'ADDED_BY_BRAND')
  ),
  constraint brand_ambassadors_brand_creator_unique unique (brand_id, creator_profile_id)
);

create index if not exists idx_brand_ambassadors_brand_id
  on public.brand_ambassadors(brand_id);

create index if not exists idx_brand_ambassadors_creator_profile_id
  on public.brand_ambassadors(creator_profile_id);

create index if not exists idx_brand_ambassadors_status
  on public.brand_ambassadors(status);

create index if not exists idx_brand_ambassadors_type
  on public.brand_ambassadors(ambassador_type);

create index if not exists idx_brand_ambassadors_created_at
  on public.brand_ambassadors(created_at);
