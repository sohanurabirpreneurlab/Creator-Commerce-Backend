import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import {
  CreateCreatorProfileDto,
  CreatorProfileListQuery,
  UpdateCreatorProfileDto,
  UpdateCreatorVerificationStatusDto,
} from "../interfaces/creator-profile.interface.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { CreatorProfileService } from "../services/creator-profile.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class CreatorProfileController {
  constructor(private readonly creatorProfileService: CreatorProfileService) {}

  public createMyProfile = async (request: Request, response: Response) => {
    const result = await this.creatorProfileService.createMyProfile(
      request.body as CreateCreatorProfileDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.CREATED,
      "Creator profile created successfully.",
      result,
    );
  };

  public getMyProfile = async (request: Request, response: Response) => {
    const result = await this.creatorProfileService.getMyProfile(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Creator profile fetched successfully.",
      result,
    );
  };

  public updateMyProfile = async (request: Request, response: Response) => {
    const result = await this.creatorProfileService.updateMyProfile(
      request.body as UpdateCreatorProfileDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Creator profile updated successfully.",
      result,
    );
  };

  public getCreatorProfileById = async (request: Request, response: Response) => {
    const result = await this.creatorProfileService.getCreatorProfileById(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Creator profile fetched successfully.",
      result,
    );
  };

  public getCreators = async (request: Request, response: Response) => {
    const result = await this.creatorProfileService.getCreators(
      request.query as CreatorProfileListQuery,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Creator profiles fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public updateVerificationStatus = async (
    request: Request,
    response: Response,
  ) => {
    const result = await this.creatorProfileService.updateVerificationStatus(
      String(request.params.id),
      request.body as UpdateCreatorVerificationStatusDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Creator verification status updated successfully.",
      result,
    );
  };
}
