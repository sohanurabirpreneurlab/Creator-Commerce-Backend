import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { UpdateNotificationPreferencesDto } from "../interfaces/notification-preference.interface.js";
import { NotificationPreferenceService } from "../services/notification-preference.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class NotificationPreferenceController {
  constructor(
    private readonly notificationPreferenceService: NotificationPreferenceService,
  ) {}

  public getMyPreferences = async (request: Request, response: Response) => {
    const result = await this.notificationPreferenceService.getMyPreferences(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Notification preferences fetched successfully.",
      result,
    );
  };

  public updateMyPreferences = async (request: Request, response: Response) => {
    const result = await this.notificationPreferenceService.updateMyPreferences(
      request.body as UpdateNotificationPreferencesDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Notification preferences updated successfully.",
      result,
    );
  };
}
