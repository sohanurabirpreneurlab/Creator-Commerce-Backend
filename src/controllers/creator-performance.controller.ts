import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { CreatorPerformanceService } from "../services/creator-performance.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class CreatorPerformanceController {
  constructor(
    private readonly creatorPerformanceService: CreatorPerformanceService,
  ) {}

  public getMyPerformance = async (request: Request, response: Response) => {
    const result = await this.creatorPerformanceService.getMyPerformance(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Creator performance fetched successfully.",
      result,
    );
  };
}
