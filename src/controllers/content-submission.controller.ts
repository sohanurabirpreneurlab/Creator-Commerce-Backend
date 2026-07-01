import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  ContentSubmissionQueryDto,
  ReviewContentSubmissionDto,
  UpdateContentSubmissionStatusDto,
} from "../interfaces/content-submission.interface.js";
import { ContentSubmissionService } from "../services/content-submission.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class ContentSubmissionController {
  constructor(
    private readonly contentSubmissionService: ContentSubmissionService,
  ) {}

  public getMyContentSubmissions = async (request: Request, response: Response) => {
    const result = await this.contentSubmissionService.getMyContentSubmissions(
      request.query as ContentSubmissionQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Content submissions fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getBrandContentSubmissions = async (
    request: Request,
    response: Response,
  ) => {
    const result = await this.contentSubmissionService.getBrandContentSubmissions(
      request.query as ContentSubmissionQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Content submissions fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getAdminContentSubmissions = async (
    request: Request,
    response: Response,
  ) => {
    const result = await this.contentSubmissionService.getAdminContentSubmissions(
      request.query as ContentSubmissionQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Content submissions fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getContentSubmissionById = async (
    request: Request,
    response: Response,
  ) => {
    const result = await this.contentSubmissionService.getContentSubmissionById(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Content submission fetched successfully.",
      result,
    );
  };

  public approveSubmission = async (request: Request, response: Response) => {
    const result = await this.contentSubmissionService.approveSubmission(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Content submission approved successfully.",
      result,
    );
  };

  public rejectSubmission = async (request: Request, response: Response) => {
    const result = await this.contentSubmissionService.rejectSubmission(
      String(request.params.id),
      request.body as ReviewContentSubmissionDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Content submission rejected successfully.",
      result,
    );
  };

  public requestChanges = async (request: Request, response: Response) => {
    const result = await this.contentSubmissionService.requestChanges(
      String(request.params.id),
      request.body as ReviewContentSubmissionDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Content submission updated successfully.",
      result,
    );
  };

  public updateSubmissionStatus = async (request: Request, response: Response) => {
    const result = await this.contentSubmissionService.adminUpdateSubmissionStatus(
      String(request.params.id),
      request.body as UpdateContentSubmissionStatusDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Content submission status updated successfully.",
      result,
    );
  };
}
