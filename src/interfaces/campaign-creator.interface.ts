import { CampaignCreatorStatus } from "../constants/campaign.constants.js";

export interface CampaignCreator {
  id: string;
  campaignId: string;
  creatorProfileId: string;
  campaignApplicationId: string | null;
  status: CampaignCreatorStatus;
  approvedAt: string;
  approvedBy: string | null;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignCreatorDto {
  campaignId: string;
  creatorProfileId: string;
  campaignApplicationId?: string | null;
}

export interface UpdateCampaignCreatorStatusDto {
  status: CampaignCreatorStatus;
}

export interface CampaignCreatorListFilters {
  page: number;
  limit: number;
  status?: CampaignCreatorStatus;
}
