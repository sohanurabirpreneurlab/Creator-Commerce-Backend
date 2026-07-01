import { CreatorVerificationStatus } from "../constants/creator-verification-status.js";

export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  category: string | null;
  location: string | null;
  profileImageUrl: string | null;
  verificationStatus: CreatorVerificationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatorProfileListItem extends CreatorProfile {
  userEmail: string;
  socialAccountsCount: number;
}

export interface CreateCreatorProfileDto {
  displayName: string;
  bio?: string;
  category?: string;
  location?: string;
  profileImageUrl?: string;
}

export interface UpdateCreatorProfileDto {
  displayName?: string;
  bio?: string;
  category?: string;
  location?: string;
  profileImageUrl?: string;
}

export interface UpdateCreatorVerificationStatusDto {
  verificationStatus: CreatorVerificationStatus;
}

export interface CreatorProfileListQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  verificationStatus?: string;
}

export interface CreatorProfileListFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  verificationStatus?: CreatorVerificationStatus;
}

export interface CreatorProfileRepositoryContract {
  create(data: {
    userId: string;
    displayName: string;
    bio: string | null;
    category: string | null;
    location: string | null;
    profileImageUrl: string | null;
    verificationStatus: CreatorVerificationStatus;
  }): Promise<CreatorProfile>;
  findById(id: string): Promise<CreatorProfile | null>;
  findByUserId(userId: string): Promise<CreatorProfile | null>;
  findMany(
    filters: CreatorProfileListFilters,
  ): Promise<{ data: CreatorProfileListItem[]; total: number }>;
  update(
    id: string,
    data: Partial<{
      displayName: string;
      bio: string | null;
      category: string | null;
      location: string | null;
      profileImageUrl: string | null;
    }>,
  ): Promise<CreatorProfile | null>;
  updateVerificationStatus(
    id: string,
    verificationStatus: CreatorVerificationStatus,
  ): Promise<CreatorProfile | null>;
  existsByUserId(userId: string): Promise<boolean>;
  countAll(): Promise<number>;
}
