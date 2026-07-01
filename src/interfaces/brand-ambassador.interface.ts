import {
  BrandAmbassadorSource,
  BrandAmbassadorStatus,
  BrandAmbassadorType,
} from "../constants/brand-ambassador.constants.js";

export interface BrandAmbassador {
  id: string;
  brandId: string;
  creatorProfileId: string;
  status: BrandAmbassadorStatus;
  ambassadorType: BrandAmbassadorType;
  source: BrandAmbassadorSource;
  assignedBy: string | null;
  joinedAt: string;
  removedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandAmbassadorListItem extends BrandAmbassador {
  brand: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    displayName: string;
    category: string | null;
    location: string | null;
    userEmail: string;
  };
}

export interface CreateBrandAmbassadorDto {
  creatorProfileId: string;
  ambassadorType?: BrandAmbassadorType;
  source?: BrandAmbassadorSource;
  notes?: string;
}

export interface UpdateBrandAmbassadorDto {
  ambassadorType?: BrandAmbassadorType;
  notes?: string;
}

export interface UpdateBrandAmbassadorStatusDto {
  status: BrandAmbassadorStatus;
}

export interface BrandAmbassadorQueryDto {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
}

export interface BrandAmbassadorListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: BrandAmbassadorStatus;
}
