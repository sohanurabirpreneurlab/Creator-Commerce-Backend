import {
  CampaignObjective,
  CampaignStatus,
} from "../constants/campaign.constants.js";

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string | null;
  objective: CampaignObjective;
  status: CampaignStatus;
  budget: number;
  destinationUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignBrandSummary {
  id: string;
  name: string;
  industry: string | null;
  website?: string | null;
  contactEmail?: string | null;
  logoUrl: string | null;
}

export interface CampaignListItem extends Campaign {
  // The dashboard pages need a compact brand summary alongside each campaign so
  // the frontend does not have to make an extra lookup request just to render
  // a table row.
  brand: CampaignBrandSummary;
}

export interface CreatorCampaignApplicationSummary {
  id: string;
  status: string;
}

export interface AvailableCampaign extends Campaign {
  brand: CampaignBrandSummary;
  application: CreatorCampaignApplicationSummary | null;
  hasApplied: boolean;
}

export interface CreateCampaignDto {
  title: string;
  description?: string;
  objective: CampaignObjective;
  budget?: number;
  destinationUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignDto {
  title?: string;
  description?: string;
  objective?: CampaignObjective;
  budget?: number;
  destinationUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignStatusDto {
  status: CampaignStatus;
}

export interface CampaignQueryDto {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  objective?: string;
}

export interface CampaignListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: CampaignStatus;
  objective?: CampaignObjective;
  onlyActive?: boolean;
}
