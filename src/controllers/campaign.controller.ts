import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  CampaignQueryDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdateCampaignStatusDto,
} from "../interfaces/campaign.interface.js";
import { CampaignService } from "../services/campaign.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  public createCampaign = async (request: Request, response: Response) => {
    const result = await this.campaignService.createCampaign(
      request.body as CreateCampaignDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.CREATED,
      "Campaign created successfully.",
      result,
    );
  };

  public getCampaignById = async (request: Request, response: Response) => {
    const result = await this.campaignService.getCampaignById(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Campaign fetched successfully.",
      result,
    );
  };

  public getAvailableCampaignsForCreator = async (
    request: Request,
    response: Response,
  ) => {
    const result = await this.campaignService.getAvailableCampaignsForCreator(
      request.query as CampaignQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Available campaigns fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getBrandCampaigns = async (request: Request, response: Response) => {
    const result = await this.campaignService.getBrandCampaigns(
      request.query as CampaignQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand campaigns fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getAdminCampaigns = async (request: Request, response: Response) => {
    const result = await this.campaignService.getAdminCampaigns(
      request.query as CampaignQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Campaigns fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public updateCampaign = async (request: Request, response: Response) => {
    const result = await this.campaignService.updateCampaign(
      String(request.params.id),
      request.body as UpdateCampaignDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Campaign updated successfully.",
      result,
    );
  };

  public updateCampaignStatus = async (request: Request, response: Response) => {
    const result = await this.campaignService.updateCampaignStatus(
      String(request.params.id),
      request.body as UpdateCampaignStatusDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Campaign status updated successfully.",
      result,
    );
  };
}
