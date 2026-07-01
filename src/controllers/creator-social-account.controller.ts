import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import {
  CreateCreatorSocialAccountDto,
  UpdateCreatorSocialAccountDto,
} from "../interfaces/creator-social-account.interface.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { CreatorSocialAccountService } from "../services/creator-social-account.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class CreatorSocialAccountController {
  constructor(
    private readonly creatorSocialAccountService: CreatorSocialAccountService,
  ) {}

  public addSocialAccount = async (request: Request, response: Response) => {
    const result = await this.creatorSocialAccountService.addSocialAccount(
      request.body as CreateCreatorSocialAccountDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.CREATED,
      "Creator social account added successfully.",
      result,
    );
  };

  public getMySocialAccounts = async (request: Request, response: Response) => {
    const result = await this.creatorSocialAccountService.getMySocialAccounts(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Creator social accounts fetched successfully.",
      result,
    );
  };

  public updateSocialAccount = async (request: Request, response: Response) => {
    const result = await this.creatorSocialAccountService.updateSocialAccount(
      String(request.params.id),
      request.body as UpdateCreatorSocialAccountDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Creator social account updated successfully.",
      result,
    );
  };

  public deleteSocialAccount = async (request: Request, response: Response) => {
    const result = await this.creatorSocialAccountService.deleteSocialAccount(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Creator social account deleted successfully.",
      result,
    );
  };

  public getSocialAccountsByCreatorProfileId = async (
    request: Request,
    response: Response,
  ) => {
    const result =
      await this.creatorSocialAccountService.getSocialAccountsByCreatorProfileId(
        String(request.params.id),
        request.user as CurrentUser,
      );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Creator social accounts fetched successfully.",
      result,
    );
  };
}
