import { TrackingLinkStatus } from "../constants/campaign.constants.js";

export interface TrackingLink {
  id: string;
  campaignId: string;
  creatorProfileId: string;
  campaignCreatorId: string | null;
  brandId: string;
  shortCode: string;
  destinationUrl: string;
  status: TrackingLinkStatus;
  generatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrackingLinkDto {
  campaignId: string;
  creatorProfileId: string;
  shortCode?: string;
  destinationUrl?: string;
}

export interface TrackingLinkQueryDto {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

export interface UpdateTrackingLinkStatusDto {
  status: TrackingLinkStatus;
}

export interface TrackingLinkListFilters {
  page: number;
  limit: number;
  status?: TrackingLinkStatus;
  search?: string;
}

export interface TrackingLinkCampaignSummary {
  id: string;
  title: string;
  objective: string;
}

export interface TrackingLinkBrandSummary {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface CreatorTrackingLinkListItem extends TrackingLink {
  trackingUrl?: string;
  campaign: TrackingLinkCampaignSummary;
  brand: TrackingLinkBrandSummary;
}
