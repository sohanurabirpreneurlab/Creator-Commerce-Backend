export enum BrandStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

export const BRAND_STATUSES = Object.values(BrandStatus);

export enum BrandManagerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  REMOVED = "REMOVED",
}

export const BRAND_MANAGER_STATUSES = Object.values(BrandManagerStatus);

export enum CreatorVerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export const CREATOR_VERIFICATION_STATUSES = Object.values(
  CreatorVerificationStatus,
);

export enum SocialPlatform {
  FACEBOOK = "FACEBOOK",
  INSTAGRAM = "INSTAGRAM",
  TIKTOK = "TIKTOK",
  YOUTUBE = "YOUTUBE",
  LINKEDIN = "LINKEDIN",
  OTHER = "OTHER",
}

export const SOCIAL_PLATFORMS = Object.values(SocialPlatform);

export enum UserStatus {
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DISABLED = "DISABLED",
}

export const USER_STATUSES = Object.values(UserStatus);
