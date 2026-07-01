create extension if not exists "pgcrypto";

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  title varchar(180) not null,
  description text,
  objective varchar(50) not null,
  status varchar(40) not null default 'DRAFT',
  budget numeric(12, 2) not null default 0,
  destination_url text,
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid references public.users(id),
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_objective_check
    check (objective in ('CLICK', 'LEAD', 'REGISTRATION', 'PURCHASE', 'RECHARGE', 'APP_INSTALL')),
  constraint campaigns_status_check
    check (status in ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'REJECTED')),
  constraint campaigns_budget_check
    check (budget >= 0)
);

create index if not exists idx_campaigns_brand_id on public.campaigns (brand_id);
create index if not exists idx_campaigns_status on public.campaigns (status);
create index if not exists idx_campaigns_objective on public.campaigns (objective);
create index if not exists idx_campaigns_created_by on public.campaigns (created_by);
create index if not exists idx_campaigns_created_at on public.campaigns (created_at);

create table if not exists public.campaign_applications (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  status varchar(40) not null default 'APPLIED',
  message text,
  applied_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_applications_status_check
    check (status in ('APPLIED', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
  constraint campaign_applications_campaign_creator_unique
    unique (campaign_id, creator_profile_id)
);

create index if not exists idx_campaign_applications_campaign_id
on public.campaign_applications (campaign_id);
create index if not exists idx_campaign_applications_creator_profile_id
on public.campaign_applications (creator_profile_id);
create index if not exists idx_campaign_applications_status
on public.campaign_applications (status);
create index if not exists idx_campaign_applications_applied_at
on public.campaign_applications (applied_at);

create table if not exists public.campaign_creators (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  campaign_application_id uuid references public.campaign_applications(id) on delete set null,
  status varchar(40) not null default 'APPROVED',
  approved_at timestamptz not null default now(),
  approved_by uuid references public.users(id),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaign_creators_status_check
    check (status in ('APPROVED', 'ACTIVE', 'PAUSED', 'REMOVED', 'COMPLETED')),
  constraint campaign_creators_campaign_creator_unique
    unique (campaign_id, creator_profile_id)
);

create index if not exists idx_campaign_creators_campaign_id
on public.campaign_creators (campaign_id);
create index if not exists idx_campaign_creators_creator_profile_id
on public.campaign_creators (creator_profile_id);
create index if not exists idx_campaign_creators_status
on public.campaign_creators (status);
create index if not exists idx_campaign_creators_approved_at
on public.campaign_creators (approved_at);

create table if not exists public.tracking_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete cascade,
  campaign_creator_id uuid references public.campaign_creators(id) on delete set null,
  brand_id uuid not null references public.brands(id) on delete cascade,
  short_code varchar(80) not null unique,
  destination_url text not null,
  status varchar(40) not null default 'ACTIVE',
  generated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tracking_links_status_check
    check (status in ('ACTIVE', 'INACTIVE', 'DEACTIVATED', 'EXPIRED'))
);

create index if not exists idx_tracking_links_campaign_id on public.tracking_links (campaign_id);
create index if not exists idx_tracking_links_creator_profile_id on public.tracking_links (creator_profile_id);
create index if not exists idx_tracking_links_brand_id on public.tracking_links (brand_id);
create index if not exists idx_tracking_links_short_code on public.tracking_links (short_code);
create index if not exists idx_tracking_links_status on public.tracking_links (status);
create index if not exists idx_tracking_links_created_at on public.tracking_links (created_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title varchar(180) not null,
  message text not null,
  type varchar(60) not null default 'GENERAL',
  entity_type varchar(80),
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications (user_id);
create index if not exists idx_notifications_is_read on public.notifications (is_read);
create index if not exists idx_notifications_type on public.notifications (type);
create index if not exists idx_notifications_created_at on public.notifications (created_at);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default true,
  campaign_updates_enabled boolean not null default true,
  payout_updates_enabled boolean not null default true,
  security_updates_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notification_preferences_user_id
on public.notification_preferences (user_id);
