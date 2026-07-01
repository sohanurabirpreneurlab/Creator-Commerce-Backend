import { ContentSubmissionStatus } from "../constants/campaign.constants.js";
import { SocialPlatform } from "../constants/social-platform.js";

export interface ContentSubmission {
  id: string;
  campaignId: string;
  creatorProfileId: string;
  campaignCreatorId: string | null;
  platform: SocialPlatform | null;
  caption: string | null;
  contentUrl: string | null;
  status: ContentSubmissionStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewComment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentSubmissionCampaignSummary {
  id: string;
  title: string;
  objective: string;
}

export interface ContentSubmissionBrandSummary {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface ContentSubmissionCreatorSummary {
  id: string;
  displayName: string;
  category: string | null;
  location: string | null;
  userEmail: string;
}

export interface CreatorContentSubmissionListItem extends ContentSubmission {
  campaign: ContentSubmissionCampaignSummary;
  brand: ContentSubmissionBrandSummary;
}

export interface ReviewerContentSubmissionListItem extends ContentSubmission {
  campaign: ContentSubmissionCampaignSummary;
  brand: ContentSubmissionBrandSummary;
  creator: ContentSubmissionCreatorSummary;
}

export interface ContentSubmissionQueryDto {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

export interface ReviewContentSubmissionDto {
  reviewComment?: string;
}

export interface UpdateContentSubmissionStatusDto {
  status: ContentSubmissionStatus;
  reviewComment?: string;
}

export interface ContentSubmissionListFilters {
  page: number;
  limit: number;
  status?: ContentSubmissionStatus;
  search?: string;
}
