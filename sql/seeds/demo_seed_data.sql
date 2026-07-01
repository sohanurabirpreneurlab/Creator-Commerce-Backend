begin;

-- Demo seed for local development.
-- This file is intentionally stored under sql/seeds instead of the root sql/
-- migration directory so it can be run manually without being treated as a schema
-- migration by the existing db:migrate script.
--
-- Important:
-- 1. Run schema migrations first.
-- 2. Replace the password hash values below if you want a different password.
-- 3. This script is written to be re-runnable for local development.

-- ============================================================================
-- 1. Users
-- ============================================================================

insert into public.users (
  name,
  email,
  role,
  status,
  mobile_number,
  address,
  gender,
  date_of_birth,
  password_hash
)
values
(
  'Demo Super Admin',
  'admin@creatorcommerce.test',
  'SUPER_ADMIN',
  'ACTIVE',
  '+8801700000001',
  'Dhaka, Bangladesh',
  'Prefer not to say',
  '1990-01-10',
  '$2b$12$KtM21Uf280GglKrmneuQF.QoIt.yGszFRTsfidFotYcLTi02xcwQy'
),
(
  'Demo Brand Manager',
  'brand@creatorcommerce.test',
  'BRAND_MANAGER',
  'ACTIVE',
  '+8801700000002',
  'Gulshan, Dhaka',
  'Prefer not to say',
  '1992-04-18',
  '$2b$12$KtM21Uf280GglKrmneuQF.QoIt.yGszFRTsfidFotYcLTi02xcwQy'
),
(
  'Demo Creator',
  'creator@creatorcommerce.test',
  'CREATOR',
  'ACTIVE',
  '+8801700000003',
  'Dhanmondi, Dhaka',
  'Prefer not to say',
  '1998-08-22',
  '$2b$12$KtM21Uf280GglKrmneuQF.QoIt.yGszFRTsfidFotYcLTi02xcwQy'
),
(
  'Campus Creator One',
  'creator2@creatorcommerce.test',
  'CREATOR',
  'ACTIVE',
  '+8801700000004',
  'Banani, Dhaka',
  'Prefer not to say',
  '1997-02-14',
  '$2b$12$KtM21Uf280GglKrmneuQF.QoIt.yGszFRTsfidFotYcLTi02xcwQy'
),
(
  'Campus Creator Two',
  'creator3@creatorcommerce.test',
  'CREATOR',
  'ACTIVE',
  '+8801700000005',
  'Mirpur, Dhaka',
  'Prefer not to say',
  '1999-11-03',
  '$2b$12$KtM21Uf280GglKrmneuQF.QoIt.yGszFRTsfidFotYcLTi02xcwQy'
)
on conflict (email)
do update set
  name = excluded.name,
  role = excluded.role,
  status = excluded.status,
  mobile_number = excluded.mobile_number,
  address = excluded.address,
  gender = excluded.gender,
  date_of_birth = excluded.date_of_birth,
  password_hash = excluded.password_hash,
  updated_at = now();

-- ============================================================================
-- 2. Brand
-- ============================================================================

insert into public.brands (
  name,
  industry,
  website,
  logo_url,
  contact_email,
  status,
  created_by
)
select
  'Grameenphone Demo',
  'Telecom',
  'https://www.grameenphone.com',
  'https://dummyimage.com/200x200/0f766e/ffffff&text=GP',
  'demo@gp.test',
  'ACTIVE',
  u.id
from public.users u
where u.email = 'admin@creatorcommerce.test'
  and not exists (
    select 1
    from public.brands b
    where b.name = 'Grameenphone Demo'
  );

update public.brands
set
  industry = 'Telecom',
  website = 'https://www.grameenphone.com',
  logo_url = 'https://dummyimage.com/200x200/0f766e/ffffff&text=GP',
  contact_email = 'demo@gp.test',
  status = 'ACTIVE',
  created_by = (select id from public.users where email = 'admin@creatorcommerce.test'),
  updated_at = now()
where name = 'Grameenphone Demo';

insert into public.brands (
  name,
  industry,
  website,
  logo_url,
  contact_email,
  status,
  created_by
)
select
  'Banglalink Demo',
  'Telecom',
  'https://www.banglalink.net',
  'https://dummyimage.com/200x200/f97316/ffffff&text=BL',
  'hello@banglalink.test',
  'ACTIVE',
  u.id
from public.users u
where u.email = 'admin@creatorcommerce.test'
  and not exists (
    select 1
    from public.brands b
    where b.name = 'Banglalink Demo'
  );

update public.brands
set
  industry = 'Telecom',
  website = 'https://www.banglalink.net',
  logo_url = 'https://dummyimage.com/200x200/f97316/ffffff&text=BL',
  contact_email = 'hello@banglalink.test',
  status = 'ACTIVE',
  created_by = (select id from public.users where email = 'admin@creatorcommerce.test'),
  updated_at = now()
where name = 'Banglalink Demo';

-- ============================================================================
-- 3. Brand manager assignment
-- ============================================================================

insert into public.brand_managers (
  user_id,
  brand_id,
  designation,
  status,
  assigned_by
)
values (
  (select id from public.users where email = 'brand@creatorcommerce.test'),
  (select id from public.brands where name = 'Grameenphone Demo'),
  'Marketing Manager',
  'ACTIVE',
  (select id from public.users where email = 'admin@creatorcommerce.test')
)
on conflict (user_id, brand_id)
do update set
  designation = excluded.designation,
  status = excluded.status,
  assigned_by = excluded.assigned_by,
  updated_at = now();

-- ============================================================================
-- 4. Creator profile
-- ============================================================================

insert into public.creator_profiles (
  user_id,
  display_name,
  bio,
  category,
  location,
  profile_image_url,
  verification_status
)
values (
  (select id from public.users where email = 'creator@creatorcommerce.test'),
  'Demo Creator',
  'I create tech, lifestyle, and youth-focused short video content.',
  'Tech & Lifestyle',
  'Dhaka',
  'https://dummyimage.com/200x200/1d4ed8/ffffff&text=DC',
  'VERIFIED'
)
on conflict (user_id)
do update set
  display_name = excluded.display_name,
  bio = excluded.bio,
  category = excluded.category,
  location = excluded.location,
  profile_image_url = excluded.profile_image_url,
  verification_status = excluded.verification_status,
  updated_at = now();

insert into public.creator_profiles (
  user_id,
  display_name,
  bio,
  category,
  location,
  profile_image_url,
  verification_status
)
values
(
  (select id from public.users where email = 'creator2@creatorcommerce.test'),
  'Campus Creator One',
  'I create youth-focused campus content and short form telecom explainers.',
  'Campus & Lifestyle',
  'Dhaka',
  'https://dummyimage.com/200x200/059669/ffffff&text=C1',
  'PENDING'
),
(
  (select id from public.users where email = 'creator3@creatorcommerce.test'),
  'Campus Creator Two',
  'I create student offer reviews and product storytelling videos.',
  'Student & Tech',
  'Chattogram',
  'https://dummyimage.com/200x200/7c3aed/ffffff&text=C2',
  'VERIFIED'
)
on conflict (user_id)
do update set
  display_name = excluded.display_name,
  bio = excluded.bio,
  category = excluded.category,
  location = excluded.location,
  profile_image_url = excluded.profile_image_url,
  verification_status = excluded.verification_status,
  updated_at = now();

-- ============================================================================
-- 5. Creator social accounts
-- ============================================================================

insert into public.creator_social_accounts (
  creator_profile_id,
  platform,
  profile_url,
  followers_count,
  engagement_rate,
  verified
)
values
(
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  'YOUTUBE',
  'https://youtube.com/@democreator',
  124000,
  4.80,
  true
),
(
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  'TIKTOK',
  'https://tiktok.com/@democreator',
  89000,
  6.10,
  true
),
(
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  'FACEBOOK',
  'https://facebook.com/democreator',
  42000,
  3.90,
  true
)
on conflict (creator_profile_id, platform, profile_url)
do update set
  followers_count = excluded.followers_count,
  engagement_rate = excluded.engagement_rate,
  verified = excluded.verified,
  updated_at = now();

insert into public.creator_social_accounts (
  creator_profile_id,
  platform,
  profile_url,
  followers_count,
  engagement_rate,
  verified
)
values
(
  (select id from public.creator_profiles where display_name = 'Campus Creator One'),
  'INSTAGRAM',
  'https://instagram.com/campuscreatorone',
  51000,
  5.40,
  true
),
(
  (select id from public.creator_profiles where display_name = 'Campus Creator Two'),
  'YOUTUBE',
  'https://youtube.com/@campuscreatortwo',
  76000,
  4.10,
  true
)
on conflict (creator_profile_id, platform, profile_url)
do update set
  followers_count = excluded.followers_count,
  engagement_rate = excluded.engagement_rate,
  verified = excluded.verified,
  updated_at = now();

-- ============================================================================
-- 6. Campaigns
-- ============================================================================

insert into public.campaigns (
  brand_id,
  title,
  description,
  objective,
  status,
  budget,
  destination_url,
  start_date,
  end_date,
  created_by,
  approved_by,
  approved_at
)
select
  (select id from public.brands where name = 'Grameenphone Demo'),
  data.title,
  data.description,
  data.objective,
  data.status,
  data.budget,
  data.destination_url,
  data.start_date,
  data.end_date,
  (select id from public.users where email = 'admin@creatorcommerce.test'),
  case
    when data.status = 'ACTIVE'
      then (select id from public.users where email = 'admin@creatorcommerce.test')
    else null
  end,
  case
    when data.status = 'ACTIVE' then now()
    else null
  end
from (
  values
    (
      'Eid Recharge Offer',
      'Promote recharge offer during Eid with short-form creator content.',
      'RECHARGE',
      'ACTIVE',
      100000::numeric,
      'https://example.com/recharge',
      '2026-07-01T00:00:00.000Z'::timestamptz,
      '2026-07-31T23:59:59.000Z'::timestamptz
    ),
    (
      'Youth Data Pack Launch',
      'Promote the latest youth data pack to university students.',
      'PURCHASE',
      'ACTIVE',
      150000::numeric,
      'https://example.com/data-pack',
      '2026-07-03T00:00:00.000Z'::timestamptz,
      '2026-08-05T23:59:59.000Z'::timestamptz
    ),
    (
      'App Install Challenge',
      'Drive app installs through creator-led challenge content.',
      'APP_INSTALL',
      'ACTIVE',
      80000::numeric,
      'https://example.com/app',
      '2026-07-10T00:00:00.000Z'::timestamptz,
      '2026-08-10T23:59:59.000Z'::timestamptz
    ),
    (
      'Student Lead Campaign',
      'Collect high-intent student leads through creator storytelling.',
      'LEAD',
      'ACTIVE',
      60000::numeric,
      'https://example.com/student-leads',
      '2026-07-15T00:00:00.000Z'::timestamptz,
      '2026-08-15T23:59:59.000Z'::timestamptz
    ),
    (
      'Campus Creator Sprint',
      'A fast creator sprint designed to boost campus awareness.',
      'CLICK',
      'ACTIVE',
      70000::numeric,
      'https://example.com/campus-sprint',
      '2026-07-20T00:00:00.000Z'::timestamptz,
      '2026-08-12T23:59:59.000Z'::timestamptz
    ),
    (
      'Future Draft Campaign',
      'Draft campaign kept out of creator discovery until activation.',
      'CLICK',
      'DRAFT',
      50000::numeric,
      'https://example.com/draft',
      '2026-09-01T00:00:00.000Z'::timestamptz,
      '2026-09-30T23:59:59.000Z'::timestamptz
    )
) as data(
  title,
  description,
  objective,
  status,
  budget,
  destination_url,
  start_date,
  end_date
)
where not exists (
  select 1
  from public.campaigns c
  where c.brand_id = (select id from public.brands where name = 'Grameenphone Demo')
    and c.title = data.title
);

update public.campaigns c
set
  description = data.description,
  objective = data.objective,
  status = data.status,
  budget = data.budget,
  destination_url = data.destination_url,
  start_date = data.start_date,
  end_date = data.end_date,
  created_by = (select id from public.users where email = 'admin@creatorcommerce.test'),
  approved_by = case
    when data.status = 'ACTIVE'
      then (select id from public.users where email = 'admin@creatorcommerce.test')
    else null
  end,
  approved_at = case
    when data.status = 'ACTIVE' then coalesce(c.approved_at, now())
    else null
  end,
  updated_at = now()
from (
  values
    (
      'Eid Recharge Offer',
      'Promote recharge offer during Eid with short-form creator content.',
      'RECHARGE',
      'ACTIVE',
      100000::numeric,
      'https://example.com/recharge',
      '2026-07-01T00:00:00.000Z'::timestamptz,
      '2026-07-31T23:59:59.000Z'::timestamptz
    ),
    (
      'Youth Data Pack Launch',
      'Promote the latest youth data pack to university students.',
      'PURCHASE',
      'ACTIVE',
      150000::numeric,
      'https://example.com/data-pack',
      '2026-07-03T00:00:00.000Z'::timestamptz,
      '2026-08-05T23:59:59.000Z'::timestamptz
    ),
    (
      'App Install Challenge',
      'Drive app installs through creator-led challenge content.',
      'APP_INSTALL',
      'ACTIVE',
      80000::numeric,
      'https://example.com/app',
      '2026-07-10T00:00:00.000Z'::timestamptz,
      '2026-08-10T23:59:59.000Z'::timestamptz
    ),
    (
      'Student Lead Campaign',
      'Collect high-intent student leads through creator storytelling.',
      'LEAD',
      'ACTIVE',
      60000::numeric,
      'https://example.com/student-leads',
      '2026-07-15T00:00:00.000Z'::timestamptz,
      '2026-08-15T23:59:59.000Z'::timestamptz
    ),
    (
      'Campus Creator Sprint',
      'A fast creator sprint designed to boost campus awareness.',
      'CLICK',
      'ACTIVE',
      70000::numeric,
      'https://example.com/campus-sprint',
      '2026-07-20T00:00:00.000Z'::timestamptz,
      '2026-08-12T23:59:59.000Z'::timestamptz
    ),
    (
      'Future Draft Campaign',
      'Draft campaign kept out of creator discovery until activation.',
      'CLICK',
      'DRAFT',
      50000::numeric,
      'https://example.com/draft',
      '2026-09-01T00:00:00.000Z'::timestamptz,
      '2026-09-30T23:59:59.000Z'::timestamptz
    )
) as data(
  title,
  description,
  objective,
  status,
  budget,
  destination_url,
  start_date,
  end_date
)
where c.brand_id = (select id from public.brands where name = 'Grameenphone Demo')
  and c.title = data.title;

-- ============================================================================
-- 7. Campaign applications
-- ============================================================================

insert into public.campaign_applications (
  campaign_id,
  creator_profile_id,
  status,
  message,
  proposed_content_type,
  primary_platform,
  expected_post_date,
  applied_at,
  reviewed_at,
  reviewed_by,
  rejection_reason
)
values
(
  (select id from public.campaigns where title = 'Eid Recharge Offer'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  'APPLIED',
  'I want to promote this campaign through a series of energetic short-form recharge explainers.',
  'SHORT_VIDEO',
  'TIKTOK',
  '2026-07-10T00:00:00.000Z'::timestamptz,
  now(),
  null,
  null,
  null
),
(
  (select id from public.campaigns where title = 'Youth Data Pack Launch'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  'APPROVED',
  'I can create student-focused pack comparison videos with a strong purchase CTA.',
  'REEL',
  'INSTAGRAM',
  '2026-07-18T00:00:00.000Z'::timestamptz,
  now(),
  now(),
  (select id from public.users where email = 'brand@creatorcommerce.test'),
  null
),
(
  (select id from public.campaigns where title = 'App Install Challenge'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  'REJECTED',
  'I can produce app challenge videos tailored to my tech-focused audience.',
  'SHORT_VIDEO',
  'YOUTUBE',
  '2026-07-19T00:00:00.000Z'::timestamptz,
  now(),
  now(),
  (select id from public.users where email = 'brand@creatorcommerce.test'),
  'We are prioritizing creators with a stronger gaming audience for this brief.'
),
(
  (select id from public.campaigns where title = 'Student Lead Campaign'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  'WITHDRAWN',
  'I can drive student signups with testimonial-led content and clear lead capture CTA.',
  'STATIC_POST',
  'FACEBOOK',
  '2026-07-24T00:00:00.000Z'::timestamptz,
  now(),
  null,
  null,
  null
),
(
  (select id from public.campaigns where title = 'Campus Creator Sprint'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  'APPROVED',
  'I can turn this sprint into a sequence of youth-focused campus challenge clips.',
  'LIVE',
  'TIKTOK',
  '2026-07-27T00:00:00.000Z'::timestamptz,
  now(),
  now(),
  (select id from public.users where email = 'brand@creatorcommerce.test'),
  null
)
on conflict (campaign_id, creator_profile_id)
do update set
  status = excluded.status,
  message = excluded.message,
  proposed_content_type = excluded.proposed_content_type,
  primary_platform = excluded.primary_platform,
  expected_post_date = excluded.expected_post_date,
  reviewed_at = excluded.reviewed_at,
  reviewed_by = excluded.reviewed_by,
  rejection_reason = excluded.rejection_reason,
  updated_at = now();

-- ============================================================================
-- 8. Campaign creators for approved applications
-- ============================================================================

insert into public.campaign_creators (
  campaign_id,
  creator_profile_id,
  campaign_application_id,
  status,
  approved_by
)
values
(
  (select id from public.campaigns where title = 'Youth Data Pack Launch'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  (
    select id
    from public.campaign_applications
    where campaign_id = (select id from public.campaigns where title = 'Youth Data Pack Launch')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  'APPROVED',
  (select id from public.users where email = 'brand@creatorcommerce.test')
),
(
  (select id from public.campaigns where title = 'Campus Creator Sprint'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  (
    select id
    from public.campaign_applications
    where campaign_id = (select id from public.campaigns where title = 'Campus Creator Sprint')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  'ACTIVE',
  (select id from public.users where email = 'brand@creatorcommerce.test')
)
on conflict (campaign_id, creator_profile_id)
do update set
  campaign_application_id = excluded.campaign_application_id,
  status = excluded.status,
  approved_by = excluded.approved_by,
  removed_at = null,
  updated_at = now();

-- ============================================================================
-- 9. Tracking links
-- ============================================================================

insert into public.tracking_links (
  campaign_id,
  creator_profile_id,
  campaign_creator_id,
  brand_id,
  short_code,
  destination_url,
  status,
  generated_by
)
values
(
  (select id from public.campaigns where title = 'Youth Data Pack Launch'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  (
    select id
    from public.campaign_creators
    where campaign_id = (select id from public.campaigns where title = 'Youth Data Pack Launch')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  (select id from public.brands where name = 'Grameenphone Demo'),
  'gp-demo-data',
  'https://example.com/data-pack',
  'ACTIVE',
  (select id from public.users where email = 'brand@creatorcommerce.test')
),
(
  (select id from public.campaigns where title = 'Campus Creator Sprint'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  (
    select id
    from public.campaign_creators
    where campaign_id = (select id from public.campaigns where title = 'Campus Creator Sprint')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  (select id from public.brands where name = 'Grameenphone Demo'),
  'gp-demo-eid',
  'https://example.com/campus-sprint',
  'EXPIRED',
  (select id from public.users where email = 'brand@creatorcommerce.test')
)
on conflict (short_code)
do update set
  campaign_id = excluded.campaign_id,
  creator_profile_id = excluded.creator_profile_id,
  campaign_creator_id = excluded.campaign_creator_id,
  brand_id = excluded.brand_id,
  destination_url = excluded.destination_url,
  status = excluded.status,
  generated_by = excluded.generated_by,
  updated_at = now();

-- ============================================================================
-- 9.1 Brand ambassadors
-- ============================================================================

insert into public.brand_ambassadors (
  brand_id,
  creator_profile_id,
  status,
  ambassador_type,
  source,
  assigned_by,
  notes
)
values
(
  (select id from public.brands where name = 'Grameenphone Demo'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  'ACTIVE',
  'LONG_TERM',
  'ADDED_BY_BRAND',
  (select id from public.users where email = 'brand@creatorcommerce.test'),
  'Primary demo ambassador for telecom youth campaigns.'
),
(
  (select id from public.brands where name = 'Grameenphone Demo'),
  (select id from public.creator_profiles where display_name = 'Campus Creator One'),
  'PAUSED',
  'CAMPAIGN_BASED',
  'ADDED_BY_BRAND',
  (select id from public.users where email = 'brand@creatorcommerce.test'),
  'Paused after the previous campus sprint ended.'
)
on conflict (brand_id, creator_profile_id)
do update set
  status = excluded.status,
  ambassador_type = excluded.ambassador_type,
  source = excluded.source,
  assigned_by = excluded.assigned_by,
  notes = excluded.notes,
  updated_at = now();

-- ============================================================================
-- 10. Content submissions
-- ============================================================================

delete from public.content_submissions
where creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  and caption in (
    'Draft cut for the youth data pack explainer reel.',
    'Submitted final version for the youth data pack campaign.',
    'Campus sprint recap approved for publishing.',
    'Campus sprint revision requested for stronger CTA ending.',
    'Rejected student lead draft with missing offer disclosure.'
  );

insert into public.content_submissions (
  campaign_id,
  creator_profile_id,
  campaign_creator_id,
  platform,
  caption,
  content_url,
  status,
  submitted_at,
  reviewed_at,
  reviewed_by,
  review_comment
)
values
(
  (select id from public.campaigns where title = 'Youth Data Pack Launch'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  (
    select id
    from public.campaign_creators
    where campaign_id = (select id from public.campaigns where title = 'Youth Data Pack Launch')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  'INSTAGRAM',
  'Draft cut for the youth data pack explainer reel.',
  'https://instagram.com/reel/demo-draft-data-pack',
  'DRAFT',
  null,
  null,
  null,
  null
),
(
  (select id from public.campaigns where title = 'Youth Data Pack Launch'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  (
    select id
    from public.campaign_creators
    where campaign_id = (select id from public.campaigns where title = 'Youth Data Pack Launch')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  'INSTAGRAM',
  'Submitted final version for the youth data pack campaign.',
  'https://instagram.com/reel/demo-submitted-data-pack',
  'SUBMITTED',
  '2026-07-22T10:00:00.000Z'::timestamptz,
  null,
  null,
  null
),
(
  (select id from public.campaigns where title = 'Campus Creator Sprint'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  (
    select id
    from public.campaign_creators
    where campaign_id = (select id from public.campaigns where title = 'Campus Creator Sprint')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  'TIKTOK',
  'Campus sprint recap approved for publishing.',
  'https://tiktok.com/@democreator/video/approved-campus',
  'APPROVED',
  '2026-07-25T09:30:00.000Z'::timestamptz,
  '2026-07-26T11:15:00.000Z'::timestamptz,
  (select id from public.users where email = 'brand@creatorcommerce.test'),
  'Looks great. Approved for publishing on schedule.'
),
(
  (select id from public.campaigns where title = 'Campus Creator Sprint'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  (
    select id
    from public.campaign_creators
    where campaign_id = (select id from public.campaigns where title = 'Campus Creator Sprint')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  'TIKTOK',
  'Campus sprint revision requested for stronger CTA ending.',
  'https://tiktok.com/@democreator/video/change-requested-campus',
  'CHANGE_REQUESTED',
  '2026-07-24T15:45:00.000Z'::timestamptz,
  '2026-07-25T12:00:00.000Z'::timestamptz,
  (select id from public.users where email = 'brand@creatorcommerce.test'),
  'Please tighten the final CTA and mention the student offer more clearly.'
),
(
  (select id from public.campaigns where title = 'Student Lead Campaign'),
  (select id from public.creator_profiles where display_name = 'Demo Creator'),
  null,
  'FACEBOOK',
  'Rejected student lead draft with missing offer disclosure.',
  'https://facebook.com/democreator/posts/rejected-student-leads',
  'REJECTED',
  '2026-07-21T12:00:00.000Z'::timestamptz,
  '2026-07-22T09:30:00.000Z'::timestamptz,
  (select id from public.users where email = 'brand@creatorcommerce.test'),
  'Please add the offer terms and disclose the lead form requirement more clearly.'
);

-- ============================================================================
-- 11. Notification preferences
-- ============================================================================

insert into public.notification_preferences (
  user_id,
  in_app_enabled,
  email_enabled,
  campaign_updates_enabled,
  payout_updates_enabled,
  security_updates_enabled
)
values
((select id from public.users where email = 'admin@creatorcommerce.test'), true, true, true, true, true),
((select id from public.users where email = 'brand@creatorcommerce.test'), true, true, true, true, true),
((select id from public.users where email = 'creator@creatorcommerce.test'), true, true, true, true, true),
((select id from public.users where email = 'creator2@creatorcommerce.test'), true, true, true, true, true),
((select id from public.users where email = 'creator3@creatorcommerce.test'), true, true, true, true, true)
on conflict (user_id)
do update set
  in_app_enabled = excluded.in_app_enabled,
  email_enabled = excluded.email_enabled,
  campaign_updates_enabled = excluded.campaign_updates_enabled,
  payout_updates_enabled = excluded.payout_updates_enabled,
  security_updates_enabled = excluded.security_updates_enabled,
  updated_at = now();

-- ============================================================================
-- 12. Notifications
-- ============================================================================

delete from public.notifications
where user_id = (select id from public.users where email = 'creator@creatorcommerce.test')
  and title in (
    'Campaign application submitted',
    'Campaign application approved',
    'Campaign application rejected',
    'Tracking link generated',
    'Content change requested'
  );

insert into public.notifications (
  user_id,
  title,
  message,
  type,
  entity_type,
  entity_id,
  is_read
)
values
(
  (select id from public.users where email = 'creator@creatorcommerce.test'),
  'Campaign application submitted',
  'Your application for Eid Recharge Offer has been submitted successfully.',
  'APPLICATION',
  'campaign_application',
  (
    select id
    from public.campaign_applications
    where campaign_id = (select id from public.campaigns where title = 'Eid Recharge Offer')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  false
),
(
  (select id from public.users where email = 'creator@creatorcommerce.test'),
  'Campaign application approved',
  'Your application for Youth Data Pack Launch has been approved.',
  'APPLICATION',
  'campaign_application',
  (
    select id
    from public.campaign_applications
    where campaign_id = (select id from public.campaigns where title = 'Youth Data Pack Launch')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  false
),
(
  (select id from public.users where email = 'creator@creatorcommerce.test'),
  'Campaign application rejected',
  'Your application for App Install Challenge was rejected.',
  'APPLICATION',
  'campaign_application',
  (
    select id
    from public.campaign_applications
    where campaign_id = (select id from public.campaigns where title = 'App Install Challenge')
      and creator_profile_id = (select id from public.creator_profiles where display_name = 'Demo Creator')
  ),
  false
),
(
  (select id from public.users where email = 'creator@creatorcommerce.test'),
  'Tracking link generated',
  'Your Youth Data Pack Launch tracking link is ready to share.',
  'TRACKING_LINK',
  'tracking_link',
  (select id from public.tracking_links where short_code = 'gp-demo-data'),
  false
),
(
  (select id from public.users where email = 'creator@creatorcommerce.test'),
  'Content change requested',
  'A submitted content draft needs revision before approval.',
  'CAMPAIGN',
  'content_submission',
  (
    select id
    from public.content_submissions
    where caption = 'Campus sprint revision requested for stronger CTA ending.'
    limit 1
  ),
  false
);

commit;
