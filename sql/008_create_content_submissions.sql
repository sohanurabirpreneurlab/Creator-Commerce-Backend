create extension if not exists pgcrypto;

create table if not exists public.content_submissions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  campaign_creator_id uuid references public.campaign_creators(id) on delete set null,
  platform varchar(50),
  caption text,
  content_url text,
  status varchar(50) not null default 'DRAFT',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  review_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_submissions_status_check check (
    status in ('DRAFT', 'SUBMITTED', 'APPROVED', 'CHANGE_REQUESTED', 'REJECTED')
  )
);

create index if not exists idx_content_submissions_campaign_id
  on public.content_submissions(campaign_id);

create index if not exists idx_content_submissions_creator_profile_id
  on public.content_submissions(creator_profile_id);

create index if not exists idx_content_submissions_campaign_creator_id
  on public.content_submissions(campaign_creator_id);

create index if not exists idx_content_submissions_status
  on public.content_submissions(status);

create index if not exists idx_content_submissions_submitted_at
  on public.content_submissions(submitted_at);

create index if not exists idx_content_submissions_created_at
  on public.content_submissions(created_at);
