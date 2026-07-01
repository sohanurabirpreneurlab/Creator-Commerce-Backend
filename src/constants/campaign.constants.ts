export enum CampaignObjective {
  CLICK = "CLICK",
  LEAD = "LEAD",
  REGISTRATION = "REGISTRATION",
  PURCHASE = "PURCHASE",
  RECHARGE = "RECHARGE",
  APP_INSTALL = "APP_INSTALL",
}

export const CAMPAIGN_OBJECTIVES = Object.values(CampaignObjective);

export enum CampaignStatus {
  DRAFT = "DRAFT",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
}

export const CAMPAIGN_STATUSES = Object.values(CampaignStatus);

export enum CampaignApplicationStatus {
  APPLIED = "APPLIED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  WITHDRAWN = "WITHDRAWN",
}

export const CAMPAIGN_APPLICATION_STATUSES = Object.values(
  CampaignApplicationStatus,
);

export enum CampaignCreatorStatus {
  APPROVED = "APPROVED",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  REMOVED = "REMOVED",
  COMPLETED = "COMPLETED",
}

export const CAMPAIGN_CREATOR_STATUSES = Object.values(CampaignCreatorStatus);

export enum TrackingLinkStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DEACTIVATED = "DEACTIVATED",
  EXPIRED = "EXPIRED",
}

export const TRACKING_LINK_STATUSES = Object.values(TrackingLinkStatus);

export enum ProposedContentType {
  SHORT_VIDEO = "SHORT_VIDEO",
  LONG_VIDEO = "LONG_VIDEO",
  STATIC_POST = "STATIC_POST",
  STORY = "STORY",
  REEL = "REEL",
  LIVE = "LIVE",
  OTHER = "OTHER",
}

export const PROPOSED_CONTENT_TYPES = Object.values(ProposedContentType);

export enum ContentSubmissionStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  CHANGE_REQUESTED = "CHANGE_REQUESTED",
  REJECTED = "REJECTED",
}

export const CONTENT_SUBMISSION_STATUSES = Object.values(ContentSubmissionStatus);
