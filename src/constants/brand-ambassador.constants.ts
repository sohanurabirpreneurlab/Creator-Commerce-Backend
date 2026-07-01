export enum BrandAmbassadorStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  REMOVED = "REMOVED",
  REJECTED = "REJECTED",
}

export const BRAND_AMBASSADOR_STATUSES = Object.values(BrandAmbassadorStatus);

export enum BrandAmbassadorType {
  LONG_TERM = "LONG_TERM",
  CAMPAIGN_BASED = "CAMPAIGN_BASED",
  EVENT_BASED = "EVENT_BASED",
  PRODUCT_BASED = "PRODUCT_BASED",
}

export const BRAND_AMBASSADOR_TYPES = Object.values(BrandAmbassadorType);

export enum BrandAmbassadorSource {
  INVITED_BY_BRAND = "INVITED_BY_BRAND",
  ADDED_BY_SUPERADMIN = "ADDED_BY_SUPERADMIN",
  CREATOR_REQUESTED = "CREATOR_REQUESTED",
  ADDED_BY_BRAND = "ADDED_BY_BRAND",
}

export const BRAND_AMBASSADOR_SOURCES = Object.values(BrandAmbassadorSource);
