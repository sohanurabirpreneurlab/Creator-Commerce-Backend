import { UserRole } from "../constants/roles.js";
import { UserStatus } from "../constants/profile.constants.js";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mobileNumber: string;
  address: string;
  gender: string;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  relatedProfileSummary?: {
    creatorProfileId?: string | null;
    brandManagerId?: string | null;
    brandId?: string | null;
  };
}

export interface UpdateBasicUserProfileDto {
  name?: string;
  mobileNumber?: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface UpdateUserRoleDto {
  role: UserRole;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
}

export interface UserListQuery {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  status?: string;
}

export interface UserListFilters {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface RoleBreakdownItem {
  role: UserRole;
  total: number;
}
