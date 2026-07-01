import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { UpdateMyProfileDto } from "../interfaces/profile.interface.js";
import { ProfileService } from "../services/profile.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  public getMyProfile = async (request: Request, response: Response) => {
    const result = await this.profileService.getMyProfile(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Profile fetched successfully.",
      result,
    );
  };

  public updateMyProfile = async (request: Request, response: Response) => {
    const result = await this.profileService.updateMyProfile(
      request.body as UpdateMyProfileDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Profile updated successfully.",
      result,
    );
  };
}
