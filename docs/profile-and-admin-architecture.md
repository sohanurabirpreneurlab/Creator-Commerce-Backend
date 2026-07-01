# Profile And Admin Architecture

## Why `ProfileService` exists

`ProfileService` gives the frontend one stable profile endpoint, `/api/profile`, for all authenticated roles.

It does not own creator rules, brand rules, or admin rules.
It only decides which role-specific service should answer the request.

This keeps profile orchestration simple and prevents `ProfileService` from becoming a god service.

## Delegation model

- `CreatorProfileService` owns creator profile creation, reading, updating, and verification rules.
- `CreatorSocialAccountService` owns creator social account CRUD and ownership checks.
- `BrandService` owns brand profile access and brand update rules.
- `BrandManagerService` owns assignment rules and brand-manager self profile access.
- `UserService` owns generic user profile reads/updates plus role/status changes.
- `SuperAdminService` orchestrates platform admin dashboard APIs such as `/api/admin/users`, `/api/admin/summary`, and `/api/admin/roles/breakdown`.

## APIs behind dashboard pages

- `/dashboard/users` and `/dashboard/users-roles` use:
  - `GET /api/admin/users`
  - `GET /api/admin/users/:id`
  - `PATCH /api/admin/users/:id/role`
  - `PATCH /api/admin/users/:id/status`
  - `GET /api/admin/roles/breakdown`
- creator admin pages use:
  - `GET /api/admin/creators`
  - `GET /api/admin/creators/:id`
  - `GET /api/admin/creators/:id/social-accounts`
  - `PATCH /api/admin/creators/:id/status`
- brand admin pages use:
  - `GET /api/admin/brands`
  - `POST /api/admin/brands`
  - `PATCH /api/admin/brands/:id`
  - `PATCH /api/admin/brands/:id/status`

## Route access

- All authenticated roles: `GET/PATCH /api/profile`
- `CREATOR`: `/api/creator/profile`, `/api/creator/social-accounts`
- `BRAND_MANAGER`: `/api/brand/profile`, `/api/brand-manager/me`
- `SUPER_ADMIN`: `/api/admin`, `/api/admin/brands`, `/api/admin/brand-managers`, `/api/admin/creators`
