import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  BrandAmbassadorQueryDto,
  CreateBrandAmbassadorDto,
  UpdateBrandAmbassadorDto,
  UpdateBrandAmbassadorStatusDto,
} from "../interfaces/brand-ambassador.interface.js";
import { BrandAmbassadorService } from "../services/brand-ambassador.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class BrandAmbassadorController {
  constructor(
    private readonly brandAmbassadorService: BrandAmbassadorService,
  ) {}

  public createBrandAmbassador = async (request: Request, response: Response) => {
    const result = await this.brandAmbassadorService.createBrandAmbassador(
      request.body as CreateBrandAmbassadorDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.CREATED,
      "Brand ambassador added successfully.",
      result,
    );
  };

  public getBrandAmbassadors = async (request: Request, response: Response) => {
    const result = await this.brandAmbassadorService.getBrandAmbassadors(
      request.query as BrandAmbassadorQueryDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand ambassadors fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public getBrandAmbassadorById = async (request: Request, response: Response) => {
    const result = await this.brandAmbassadorService.getBrandAmbassadorById(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand ambassador fetched successfully.",
      result,
    );
  };

  public updateBrandAmbassador = async (request: Request, response: Response) => {
    const result = await this.brandAmbassadorService.updateBrandAmbassador(
      String(request.params.id),
      request.body as UpdateBrandAmbassadorDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand ambassador updated successfully.",
      result,
    );
  };

  public updateBrandAmbassadorStatus = async (
    request: Request,
    response: Response,
  ) => {
    const result = await this.brandAmbassadorService.updateBrandAmbassadorStatus(
      String(request.params.id),
      request.body as UpdateBrandAmbassadorStatusDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand ambassador status updated successfully.",
      result,
    );
  };

  public removeBrandAmbassador = async (request: Request, response: Response) => {
    const result = await this.brandAmbassadorService.removeBrandAmbassador(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand ambassador removed successfully.",
      result,
    );
  };
}
