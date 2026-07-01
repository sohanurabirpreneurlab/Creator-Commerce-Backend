import { BrandStatus } from "../constants/brand-status.js";

export interface Brand {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  status: BrandStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandDto {
  name: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  contactEmail?: string;
}

export interface UpdateBrandDto {
  name?: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  contactEmail?: string;
}

export interface UpdateBrandStatusDto {
  status: BrandStatus;
}

export interface BrandListQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
}

export interface BrandListFilters {
  search?: string;
  status?: BrandStatus;
  page: number;
  limit: number;
}

export interface BrandRepositoryContract {
  create(data: {
    name: string;
    industry: string | null;
    website: string | null;
    logoUrl: string | null;
    contactEmail: string | null;
    status: BrandStatus;
    createdBy: string | null;
  }): Promise<Brand>;
  findById(id: string): Promise<Brand | null>;
  findMany(filters: BrandListFilters): Promise<{ data: Brand[]; total: number }>;
  update(
    id: string,
    data: Partial<{
      name: string;
      industry: string | null;
      website: string | null;
      logoUrl: string | null;
      contactEmail: string | null;
    }>,
  ): Promise<Brand | null>;
  updateStatus(id: string, status: BrandStatus): Promise<Brand | null>;
  existsByName(name: string, excludeId?: string): Promise<boolean>;
  countAll(): Promise<number>;
}
