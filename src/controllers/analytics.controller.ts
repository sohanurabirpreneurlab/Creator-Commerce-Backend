import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  public getBrandAnalytics = async (request: Request, response: Response) => {
    const result = await this.analyticsService.getBrandAnalytics(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand analytics fetched successfully.",
      result,
    );
  };

  public getAdminAnalytics = async (request: Request, response: Response) => {
    const result = await this.analyticsService.getAdminAnalytics(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Platform analytics fetched successfully.",
      result,
    );
  };
}
