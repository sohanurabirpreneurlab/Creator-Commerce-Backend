import { BrandManager } from "./brand-manager.interface.js";
import { Brand, UpdateBrandDto } from "./brand.interface.js";
import {
  CreatorProfile,
  UpdateCreatorProfileDto,
} from "./creator-profile.interface.js";
import { CreatorSocialAccount } from "./creator-social-account.interface.js";
import { UpdateBasicUserProfileDto, User } from "./user.interface.js";

export interface ProfileCompletion {
  percentage: number;
  completedFields: number;
  totalFields: number;
  missingFields: string[];
}

export interface UpdateMyProfileDto {
  user?: UpdateBasicUserProfileDto;
  creatorProfile?: UpdateCreatorProfileDto;
  brandManager?: {
    designation?: string;
  };
  brand?: UpdateBrandDto;
}

export interface CreatorProfileResponse {
  user: User;
  role: "CREATOR";
  profileType: "CREATOR_PROFILE";
  creatorProfile: CreatorProfile | null;
  socialAccounts: CreatorSocialAccount[];
  completion: ProfileCompletion;
}

export interface BrandManagerProfileResponse {
  user: User;
  role: "BRAND_MANAGER";
  profileType: "BRAND_MANAGER_PROFILE";
  brandManager: BrandManager;
  brand: Brand;
  completion: ProfileCompletion;
}

export interface SuperAdminProfileResponse {
  user: User;
  role: "SUPER_ADMIN";
  profileType: "SUPER_ADMIN_PROFILE";
  completion: ProfileCompletion;
}

export type ProfileResponse =
  | CreatorProfileResponse
  | BrandManagerProfileResponse
  | SuperAdminProfileResponse;
