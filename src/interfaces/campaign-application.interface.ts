import {
  CampaignApplicationStatus,
  ProposedContentType,
} from "../constants/campaign.constants.js";
import { SocialPlatform } from "../constants/social-platform.js";

export interface CampaignApplication {
  id: string;
  campaignId: string;
  creatorProfileId: string;
  status: CampaignApplicationStatus;
  message: string | null;
  proposedContentType: ProposedContentType | null;
  primaryPlatform: SocialPlatform | null;
  expectedPostDate: string | null;
  appliedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyToCampaignDto {
  message: string;
  proposedContentType?: ProposedContentType;
  primaryPlatform?: SocialPlatform;
  expectedPostDate?: string;
}

export interface ReviewCampaignApplicationDto {
  rejectionReason?: string;
}

export interface CampaignApplicationQueryDto {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

export interface CampaignApplicationListFilters {
  page: number;
  limit: number;
  status?: CampaignApplicationStatus;
  search?: string;
}

export interface CampaignApplicationCampaignSummary {
  id: string;
  title: string;
  objective: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

export interface CampaignApplicationBrandSummary {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface CampaignApplicationCreatorSummary {
  id: string;
  displayName: string;
  category: string | null;
  location: string | null;
  userEmail: string;
}

export interface CreatorApplicationListItem extends CampaignApplication {
  campaign: CampaignApplicationCampaignSummary;
  brand: CampaignApplicationBrandSummary;
}

export interface ReviewerApplicationListItem extends CampaignApplication {
  campaign: CampaignApplicationCampaignSummary;
  brand: CampaignApplicationBrandSummary;
  creator: CampaignApplicationCreatorSummary;
}
