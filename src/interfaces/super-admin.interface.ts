import { UpdateUserRoleDto, UpdateUserStatusDto, UserListQuery } from "./user.interface.js";

export interface PlatformSummary {
  users: {
    total: number;
    byRole: Array<{
      role: string;
      total: number;
    }>;
  };
  brands: {
    total: number;
  };
  creators: {
    total: number;
  };
  brandManagers: {
    total: number;
  };
}

export type GetUsersWithRolesQuery = UserListQuery;

export type UpdateAdminUserRoleDto = UpdateUserRoleDto;
export type UpdateAdminUserStatusDto = UpdateUserStatusDto;
