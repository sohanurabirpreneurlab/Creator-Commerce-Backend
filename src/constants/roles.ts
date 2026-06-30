// All future RBAC checks should use this enum instead of raw role strings.
export enum UserRole {
  CREATOR = "CREATOR",
  BRAND_MANAGER = "BRAND_MANAGER",
  SUPER_ADMIN = "SUPER_ADMIN",
}

// Keep a reusable list for token validation and middleware authorization checks.
export const USER_ROLES = Object.values(UserRole);
