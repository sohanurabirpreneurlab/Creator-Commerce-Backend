import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  CreateTrackingLinkDto,
  TrackingLinkQueryDto,
} from "../interfaces/tracking-link.interface.js";
import { TrackingLinkService } from "../services/tracking-link.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class TrackingLinkController {
  constructor(private readonly trackingLinkService: TrackingLinkService) {}

  public createTrackingLink = async (request: Request, response: Response) => {
    const result = await this.trackingLinkService.createTrackingLink(
      request.body as CreateTrackingLinkDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.CREATED,
      "Tracking link created successfully.",
      result,
    );
  };

  public getTrackingLinkById = async (request: Request, response: Response) => {
    const result = await this.trackingLinkService.getTrackingLinkById(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Tracking link fetched successfully.",
      result,
    );
  };

  public getMyTrackingLinks = async (request: Request, response: Response) => {
    const result = await this.trackingLinkService.getMyTrackingLinks(
      request.query as TrackingLinkQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Tracking links fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getBrandTrackingLinks = async (request: Request, response: Response) => {
    const result = await this.trackingLinkService.getBrandTrackingLinks(
      request.query as TrackingLinkQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Tracking links fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getAdminTrackingLinks = async (request: Request, response: Response) => {
    const result = await this.trackingLinkService.getAdminTrackingLinks(
      request.query as TrackingLinkQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Tracking links fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public deactivateTrackingLink = async (request: Request, response: Response) => {
    const result = await this.trackingLinkService.deactivateTrackingLink(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Tracking link deactivated successfully.",
      result,
    );
  };
}
