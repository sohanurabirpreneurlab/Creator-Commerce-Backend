alter table public.campaign_applications
add column if not exists proposed_content_type varchar(50),
add column if not exists primary_platform varchar(50),
add column if not exists expected_post_date timestamptz;
