import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  GetUsersWithRolesQuery,
  UpdateAdminUserRoleDto,
  UpdateAdminUserStatusDto,
} from "../interfaces/super-admin.interface.js";
import { SuperAdminService } from "../services/super-admin.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  public getPlatformSummary = async (request: Request, response: Response) => {
    const result = await this.superAdminService.getPlatformSummary(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Platform summary fetched successfully.",
      result,
    );
  };

  public getUsersWithRoles = async (request: Request, response: Response) => {
    const result = await this.superAdminService.getUsersWithRoles(
      request.query as GetUsersWithRolesQuery,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Users fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getUserDetails = async (request: Request, response: Response) => {
    const result = await this.superAdminService.getUserDetails(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "User details fetched successfully.",
      result,
    );
  };

  public updateUserRole = async (request: Request, response: Response) => {
    const result = await this.superAdminService.updateUserRole(
      String(request.params.id),
      request.body as UpdateAdminUserRoleDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "User role updated successfully.",
      result,
    );
  };

  public updateUserStatus = async (request: Request, response: Response) => {
    const result = await this.superAdminService.updateUserStatus(
      String(request.params.id),
      request.body as UpdateAdminUserStatusDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "User status updated successfully.",
      result,
    );
  };

  public getRoleBreakdown = async (request: Request, response: Response) => {
    const result = await this.superAdminService.getRoleBreakdown(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Role breakdown fetched successfully.",
      result,
    );
  };
}
