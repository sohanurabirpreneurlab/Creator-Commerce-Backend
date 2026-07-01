# Profile Foundation

This backend foundation introduces four core concepts that later campaign and marketplace features will depend on.

## What each resource means

- `Brand`: A company or business entity that will later run influencer campaigns on the platform.
- `BrandManager`: A mapping record that says which `BRAND_MANAGER` user is assigned to which `Brand`.
- `CreatorProfile`: The public-facing creator identity owned by one `CREATOR` user.
- `CreatorSocialAccount`: A social channel attached to one `CreatorProfile`, such as YouTube or Instagram.

## Role access

- `SUPER_ADMIN` can create, list, update, and change brand status.
- `SUPER_ADMIN` can assign, list, update, and remove brand manager assignments.
- `SUPER_ADMIN` can list creator profiles, fetch creator details, fetch creator social accounts, and update verification status.
- `BRAND_MANAGER` can fetch and update only their assigned brand profile.
- `BRAND_MANAGER` can fetch only their own assignment via `/api/brand-manager/me`.
- `CREATOR` can create, fetch, and update only their own creator profile.
- `CREATOR` can create, list, update, and delete only their own social accounts.

## Why this exists before campaigns

Campaigns need reliable ownership and relationship data before any workflow can be built on top:

- a campaign must belong to a real brand,
- a brand action must be traceable to an assigned brand manager,
- creator selection needs a stable creator profile,
- and social metrics need to be attached to concrete creator social accounts.

Without this foundation, later modules such as campaigns, applications, tracking, payouts, and analytics would have to duplicate identity and ownership rules.
