import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { NotificationQueryDto } from "../interfaces/notification.interface.js";
import { NotificationService } from "../services/notification.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  public getMyNotifications = async (request: Request, response: Response) => {
    const result = await this.notificationService.getMyNotifications(
      request.query as NotificationQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Notifications fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public markAsRead = async (request: Request, response: Response) => {
    const result = await this.notificationService.markAsRead(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Notification marked as read.",
      result,
    );
  };

  public markAllAsRead = async (request: Request, response: Response) => {
    const result = await this.notificationService.markAllAsRead(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "All notifications marked as read.",
      result,
    );
  };
}
