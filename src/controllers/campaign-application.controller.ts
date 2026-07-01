import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  ApplyToCampaignDto,
  CampaignApplicationQueryDto,
  ReviewCampaignApplicationDto,
} from "../interfaces/campaign-application.interface.js";
import { CampaignApplicationService } from "../services/campaign-application.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class CampaignApplicationController {
  constructor(
    private readonly campaignApplicationService: CampaignApplicationService,
  ) {}

  public applyToCampaign = async (request: Request, response: Response) => {
    const result = await this.campaignApplicationService.applyToCampaign(
      String(request.params.campaignId),
      request.body as ApplyToCampaignDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.CREATED,
      "Campaign application submitted successfully.",
      result,
    );
  };

  public getMyApplications = async (request: Request, response: Response) => {
    const result = await this.campaignApplicationService.getMyApplications(
      request.query as CampaignApplicationQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Applications fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getApplicationById = async (request: Request, response: Response) => {
    const result = await this.campaignApplicationService.getApplicationById(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Application fetched successfully.",
      result,
    );
  };

  public withdrawApplication = async (request: Request, response: Response) => {
    const result = await this.campaignApplicationService.withdrawApplication(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Application withdrawn successfully.",
      result,
    );
  };

  public getBrandApplications = async (request: Request, response: Response) => {
    const result = await this.campaignApplicationService.getBrandApplications(
      request.query as CampaignApplicationQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand applications fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public approveApplication = async (request: Request, response: Response) => {
    const result = await this.campaignApplicationService.approveApplication(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Application approved successfully.",
      result,
    );
  };

  public rejectApplication = async (request: Request, response: Response) => {
    const result = await this.campaignApplicationService.rejectApplication(
      String(request.params.id),
      request.body as ReviewCampaignApplicationDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Application rejected successfully.",
      result,
    );
  };

  public getAdminApplications = async (request: Request, response: Response) => {
    const result = await this.campaignApplicationService.getAdminApplications(
      request.query as CampaignApplicationQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Campaign applications fetched successfully.",
      result.data,
      result.meta,
    );
  };
}
