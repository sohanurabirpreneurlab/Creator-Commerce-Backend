# Basic Campaign Tracking Notification Foundation

This increment adds six new tables that are enough to support the first campaign workflow without introducing the rest of the long-term platform schema.

## Why these tables were added

- `campaigns`: stores brand-created campaign records
- `campaign_applications`: stores creator applications to campaigns
- `campaign_creators`: stores creators approved into campaigns
- `tracking_links`: stores unique campaign promotion links for approved creators
- `notifications`: stores in-app user notifications
- `notification_preferences`: stores notification settings per user

## Classes added by module

- Campaign:
  - `CampaignController`
  - `CampaignService`
  - `CampaignRepository`
- Campaign Application:
  - `CampaignApplicationController`
  - `CampaignApplicationService`
  - `CampaignApplicationRepository`
- Campaign Creator:
  - `CampaignCreatorService`
  - `CampaignCreatorRepository`
- Tracking Link:
  - `TrackingLinkController`
  - `TrackingLinkService`
  - `TrackingLinkRepository`
- Notification:
  - `NotificationController`
  - `NotificationService`
  - `NotificationRepository`
- Notification Preference:
  - `NotificationPreferenceController`
  - `NotificationPreferenceService`
  - `NotificationPreferenceRepository`

## Routes added

- Creator campaign routes
- Creator application routes
- Creator tracking routes
- Brand campaign routes
- Brand application routes
- Brand tracking routes
- Admin campaign routes
- Admin tracking routes
- Notification routes
- Notification preference routes

## Intentionally not implemented yet

- public redirect endpoints
- click tracking
- visitor sessions
- conversions
- attribution
- fraud detection
- analytics tables
- payout tables
- content approval workflow

## Next likely tables

- `click_events`
- `visitor_sessions`
- `conversion_events`
- `attribution_records`
- `fraud_events`
- aggregated analytics stats tables
- payout and settlement tables
