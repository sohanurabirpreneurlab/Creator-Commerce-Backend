create extension if not exists "pgcrypto";

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name varchar(150) not null,
  industry varchar(100),
  website varchar(255),
  logo_url text,
  contact_email varchar(150),
  status varchar(30) not null default 'PENDING',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_status_check
    check (status in ('PENDING', 'ACTIVE', 'SUSPENDED'))
);

create index if not exists idx_brands_status on public.brands (status);
create index if not exists idx_brands_name on public.brands (name);
create index if not exists idx_brands_created_at on public.brands (created_at);

create table if not exists public.brand_managers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  designation varchar(100),
  status varchar(30) not null default 'ACTIVE',
  assigned_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_managers_status_check
    check (status in ('ACTIVE', 'INACTIVE', 'REMOVED')),
  constraint brand_managers_user_brand_unique
    unique (user_id, brand_id)
);

create index if not exists idx_brand_managers_user_id on public.brand_managers (user_id);
create index if not exists idx_brand_managers_brand_id on public.brand_managers (brand_id);
create index if not exists idx_brand_managers_status on public.brand_managers (status);

create table if not exists public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name varchar(150) not null,
  bio text,
  category varchar(100),
  location varchar(150),
  profile_image_url text,
  verification_status varchar(30) not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_profiles_verification_status_check
    check (verification_status in ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'))
);

create index if not exists idx_creator_profiles_user_id on public.creator_profiles (user_id);
create index if not exists idx_creator_profiles_category on public.creator_profiles (category);
create index if not exists idx_creator_profiles_verification_status on public.creator_profiles (verification_status);
create index if not exists idx_creator_profiles_created_at on public.creator_profiles (created_at);

create table if not exists public.creator_social_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  platform varchar(30) not null,
  profile_url text not null,
  followers_count integer not null default 0,
  engagement_rate numeric(5, 2),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint creator_social_accounts_platform_check
    check (platform in ('FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'OTHER')),
  constraint creator_social_accounts_followers_count_check
    check (followers_count >= 0),
  constraint creator_social_accounts_engagement_rate_check
    check (engagement_rate is null or (engagement_rate >= 0 and engagement_rate <= 100)),
  constraint creator_social_accounts_unique_profile_platform_url
    unique (creator_profile_id, platform, profile_url)
);

create index if not exists idx_creator_social_accounts_creator_profile_id
on public.creator_social_accounts (creator_profile_id);

create index if not exists idx_creator_social_accounts_platform
on public.creator_social_accounts (platform);
