import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { BrandListQuery, CreateBrandDto, UpdateBrandDto, UpdateBrandStatusDto } from "../interfaces/brand.interface.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { BrandService } from "../services/brand.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  public createBrand = async (request: Request, response: Response) => {
    const result = await this.brandService.createBrand(
      request.body as CreateBrandDto,
      request.user as CurrentUser,
    );

    return sendSuccess(response, HTTP_STATUS.CREATED, "Brand created successfully.", result);
  };

  public getBrandById = async (request: Request, response: Response) => {
    const result = await this.brandService.getBrandById(
      String(request.params.id),
      request.user as CurrentUser,
    );

    return sendSuccess(response, HTTP_STATUS.OK, "Brand fetched successfully.", result);
  };

  public getBrands = async (request: Request, response: Response) => {
    const result = await this.brandService.getBrands(
      request.query as BrandListQuery,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brands fetched successfully.",
      result.data,
      result.meta,
    );
  };

  public updateBrand = async (request: Request, response: Response) => {
    const result = await this.brandService.updateBrand(
      String(request.params.id),
      request.body as UpdateBrandDto,
      request.user as CurrentUser,
    );

    return sendSuccess(response, HTTP_STATUS.OK, "Brand updated successfully.", result);
  };

  public updateBrandStatus = async (request: Request, response: Response) => {
    const result = await this.brandService.updateBrandStatus(
      String(request.params.id),
      request.body as UpdateBrandStatusDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand status updated successfully.",
      result,
    );
  };

  public getMyBrand = async (request: Request, response: Response) => {
    const result = await this.brandService.getMyBrand(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand profile fetched successfully.",
      result,
    );
  };

  public updateMyBrand = async (request: Request, response: Response) => {
    const result = await this.brandService.updateMyBrand(
      request.body as UpdateBrandDto,
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Brand profile updated successfully.",
      result,
    );
  };
}
