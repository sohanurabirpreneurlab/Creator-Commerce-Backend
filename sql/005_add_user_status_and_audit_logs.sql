alter table public.users
add column if not exists status varchar(30) not null default 'ACTIVE';

update public.users
set status = 'ACTIVE'
where status is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_status_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
    add constraint users_status_check
    check (status in ('ACTIVE', 'SUSPENDED', 'DISABLED'));
  end if;
end $$;

create index if not exists idx_users_status on public.users (status);
create index if not exists idx_users_role on public.users (role);
create index if not exists idx_users_created_at on public.users (created_at);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id),
  target_user_id uuid references public.users(id),
  action varchar(100) not null,
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor_user_id on public.audit_logs (actor_user_id);
create index if not exists idx_audit_logs_target_user_id on public.audit_logs (target_user_id);
create index if not exists idx_audit_logs_action on public.audit_logs (action);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at);
