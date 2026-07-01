import { SocialPlatform } from "../constants/social-platform.js";

export interface CreatorSocialAccount {
  id: string;
  creatorProfileId: string;
  platform: SocialPlatform;
  profileUrl: string;
  followersCount: number;
  engagementRate: number | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreatorSocialAccountDto {
  platform: SocialPlatform;
  profileUrl: string;
  followersCount?: number;
  engagementRate?: number;
  verified?: boolean;
}

export interface UpdateCreatorSocialAccountDto {
  profileUrl?: string;
  followersCount?: number;
  engagementRate?: number;
  verified?: boolean;
}

export interface CreatorSocialAccountRepositoryContract {
  create(data: {
    creatorProfileId: string;
    platform: SocialPlatform;
    profileUrl: string;
    followersCount: number;
    engagementRate: number | null;
    verified: boolean;
  }): Promise<CreatorSocialAccount>;
  findById(id: string): Promise<CreatorSocialAccount | null>;
  findManyByCreatorProfileId(
    creatorProfileId: string,
  ): Promise<CreatorSocialAccount[]>;
  update(
    id: string,
    data: Partial<{
      profileUrl: string;
      followersCount: number;
      engagementRate: number | null;
      verified: boolean;
    }>,
  ): Promise<CreatorSocialAccount | null>;
  delete(id: string): Promise<boolean>;
  findByCreatorPlatformAndUrl(
    creatorProfileId: string,
    platform: SocialPlatform,
    profileUrl: string,
  ): Promise<CreatorSocialAccount | null>;
}
