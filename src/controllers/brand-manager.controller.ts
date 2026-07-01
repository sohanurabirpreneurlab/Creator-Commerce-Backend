import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import {
  AssignBrandManagerDto,
  BrandManagerListQuery,
  UpdateBrandManagerDto,
} from "../interfaces/brand-manager.interface.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { BrandManagerService } from "../services/brand-manager.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class BrandManagerController {
  constructor(private readonly brandManagerService: BrandManagerService) {}

  public assignBrandManager = async (request: Request, response: Response) => {
    const result = await this.brandManagerService.assignBrandManager(
      request.body as AssignBrandManagerDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.CREATED,
      "Brand manager assigned successfully.",
      result,
    );
  };

  public getBrandManagerById = async (request: Request, response: Response) => {
    const result = await this.brandManagerService.getBrandManagerById(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand manager assignment fetched successfully.",
      result,
    );
  };

  public getBrandManagers = async (request: Request, response: Response) => {
    const result = await this.brandManagerService.getBrandManagers(
      request.query as BrandManagerListQuery,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand manager assignments fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getBrandManagersByBrand = async (request: Request, response: Response) => {
    const result = await this.brandManagerService.getBrandManagersByBrand(
      String(request.params.brandId),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand managers fetched successfully.",
      result,
    );
  };

  public updateBrandManager = async (request: Request, response: Response) => {
    const result = await this.brandManagerService.updateBrandManager(
      String(request.params.id),
      request.body as UpdateBrandManagerDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand manager assignment updated successfully.",
      result,
    );
  };

  public removeBrandManager = async (request: Request, response: Response) => {
    const result = await this.brandManagerService.removeBrandManager(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand manager removed successfully.",
      result,
    );
  };

  public getMyBrandManagerProfile = async (
    request: Request,
    response: Response,
  ) => {
    const result = await this.brandManagerService.getMyBrandManagerProfile(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand manager profile fetched successfully.",
      result,
    );
  };
}
