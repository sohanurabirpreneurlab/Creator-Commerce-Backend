import { BrandManagerStatus } from "../constants/brand-manager-status.js";

export interface BrandManager {
  id: string;
  userId: string;
  brandId: string;
  designation: string | null;
  status: BrandManagerStatus;
  assignedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssignBrandManagerDto {
  userId: string;
  brandId: string;
  designation?: string;
}

export interface UpdateBrandManagerDto {
  designation?: string;
  status?: BrandManagerStatus;
}

export interface BrandManagerListQuery {
  page?: string;
  limit?: string;
  status?: string;
  brandId?: string;
  userId?: string;
}

export interface BrandManagerListFilters {
  page: number;
  limit: number;
  status?: BrandManagerStatus;
  brandId?: string;
  userId?: string;
}

export interface BrandManagerRepositoryContract {
  create(data: {
    userId: string;
    brandId: string;
    designation: string | null;
    status: BrandManagerStatus;
    assignedBy: string | null;
  }): Promise<BrandManager>;
  findById(id: string): Promise<BrandManager | null>;
  findByUserId(userId: string): Promise<BrandManager[]>;
  findManyByBrandId(brandId: string): Promise<BrandManager[]>;
  findMany(
    filters: BrandManagerListFilters,
  ): Promise<{ data: BrandManager[]; total: number }>;
  findByUserAndBrand(userId: string, brandId: string): Promise<BrandManager | null>;
  update(
    id: string,
    data: Partial<{
      designation: string | null;
      status: BrandManagerStatus;
    }>,
  ): Promise<BrandManager | null>;
  updateStatus(
    id: string,
    status: BrandManagerStatus,
  ): Promise<BrandManager | null>;
  countAll(): Promise<number>;
}
