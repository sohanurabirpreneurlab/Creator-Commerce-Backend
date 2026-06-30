alter table public.users
add column if not exists role varchar(30) not null default 'CREATOR';

update public.users
set role = 'CREATOR'
where role is null;

alter table public.users
alter column role set default 'CREATOR';

alter table public.users
alter column role set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_role_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
    add constraint users_role_check
    check (role in ('CREATOR', 'BRAND_MANAGER', 'SUPER_ADMIN'));
  end if;
end $$;
