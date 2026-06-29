alter table public.users
add column if not exists password_hash text;

create index if not exists idx_users_mobile_number
on public.users (mobile_number);
