import {
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_STATUSES,
  CampaignStatus,
} from "../constants/campaign.constants.js";
import { UserRole } from "../constants/roles.js";
import { BadRequestError } from "../errors/bad-request-error.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  CampaignQueryDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  UpdateCampaignStatusDto,
} from "../interfaces/campaign.interface.js";
import { CampaignRepository } from "../repositories/campaign.repository.js";
import { CreatorProfileRepository } from "../repositories/creator-profile.repository.js";
import { BrandManagerService } from "./brand-manager.service.js";
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination.js";
import {
  ensureAtLeastOneField,
  normalizeOptionalString,
  requireTrimmedString,
  validateEnumValue,
  validateOptionalUrl,
} from "../utils/validation.js";

export class CampaignService {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly brandManagerService: BrandManagerService,
    private readonly creatorProfileRepository: CreatorProfileRepository,
  ) {}

  public async createCampaign(dto: CreateCampaignDto, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can create campaigns.",
        "CAMPAIGN_CREATE_FORBIDDEN",
      );
    }

    const assignment = await this.brandManagerService.getMyBrandManagerProfile(
      currentUser,
    );
    const payload = this.normalizeCampaignPayload(dto);
    const objective = validateEnumValue(dto.objective, CAMPAIGN_OBJECTIVES, "objective");
    const budget = dto.budget === undefined ? 0 : this.validateBudget(dto.budget);

    return this.campaignRepository.create({
      brandId: assignment.brandId,
      title: requireTrimmedString(dto.title, "title"),
      description: payload.description ?? null,
      objective,
      status: CampaignStatus.DRAFT,
      budget,
      destinationUrl: payload.destinationUrl ?? null,
      startDate: payload.startDate ?? null,
      endDate: payload.endDate ?? null,
      createdBy: currentUser.id,
    });
  }

  public async getCampaignById(id: string, currentUser: CurrentUser) {
    if (currentUser.role === UserRole.CREATOR) {
      const creatorProfile = await this.getCreatorProfileOrThrow(currentUser);
      const campaign = await this.campaignRepository.findActiveDetailForCreator(
        id,
        creatorProfile.id,
      );

      if (!campaign) {
        throw new NotFoundError("Campaign not found.", "CAMPAIGN_NOT_FOUND");
      }

      return campaign;
    }

    const campaign = await this.campaignRepository.findDetailedById(id);
    if (!campaign) {
      throw new NotFoundError("Campaign not found.", "CAMPAIGN_NOT_FOUND");
    }

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return campaign;
    }

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      const assignment = await this.brandManagerService.getMyBrandManagerProfile(
        currentUser,
      );

      if (assignment.brandId !== campaign.brandId) {
        throw new ForbiddenError(
          "Brand managers can only access their own brand campaigns.",
          "CAMPAIGN_ACCESS_FORBIDDEN",
        );
      }

      return campaign;
    }

    throw new ForbiddenError(
      "You do not have access to this campaign.",
      "CAMPAIGN_ACCESS_FORBIDDEN",
    );
  }

  public async getAvailableCampaignsForCreator(
    query: CampaignQueryDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can list available campaigns.",
        "CAMPAIGN_ACCESS_FORBIDDEN",
      );
    }

    const creatorProfile = await this.getCreatorProfileOrThrow(currentUser);
    const filters = this.buildQueryFilters(query, true);
    const result = await this.campaignRepository.findAvailableForCreator(
      creatorProfile.id,
      filters,
    );

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async getBrandCampaigns(query: CampaignQueryDto, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can view brand campaigns.",
        "CAMPAIGN_ACCESS_FORBIDDEN",
      );
    }

    const assignment = await this.brandManagerService.getMyBrandManagerProfile(
      currentUser,
    );
    const filters = this.buildQueryFilters(query);
    const result = await this.campaignRepository.findManyByBrandId(
      assignment.brandId,
      filters,
    );

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async getAdminCampaigns(query: CampaignQueryDto, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can view all campaigns.",
        "CAMPAIGN_ACCESS_FORBIDDEN",
      );
    }

    const filters = this.buildQueryFilters(query);
    const result = await this.campaignRepository.findMany(filters);

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async updateCampaign(
    id: string,
    dto: UpdateCampaignDto,
    currentUser: CurrentUser,
  ) {
    const campaign = await this.getCampaignById(id, currentUser);

    if (
      currentUser.role !== UserRole.BRAND_MANAGER &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenError(
        "You cannot update this campaign.",
        "CAMPAIGN_UPDATE_FORBIDDEN",
      );
    }

    const payload = this.normalizeCampaignPayload(dto);
    ensureAtLeastOneField(Object.values(payload));

    const updatedCampaign = await this.campaignRepository.update(campaign.id, payload);
    if (!updatedCampaign) {
      throw new NotFoundError("Campaign not found.", "CAMPAIGN_NOT_FOUND");
    }

    return updatedCampaign;
  }

  public async updateCampaignStatus(
    id: string,
    dto: UpdateCampaignStatusDto,
    currentUser: CurrentUser,
  ) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new NotFoundError("Campaign not found.", "CAMPAIGN_NOT_FOUND");
    }

    const status = validateEnumValue(dto.status, CAMPAIGN_STATUSES, "status");

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const metadata =
        status === CampaignStatus.ACTIVE
          ? {
              approvedBy: currentUser.id,
              approvedAt: new Date().toISOString(),
            }
          : undefined;

      const updatedCampaign = await this.campaignRepository.updateStatus(
        id,
        status,
        metadata,
      );

      if (!updatedCampaign) {
        throw new NotFoundError("Campaign not found.", "CAMPAIGN_NOT_FOUND");
      }

      return updatedCampaign;
    }

    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "You do not have access to update campaign status.",
        "CAMPAIGN_STATUS_FORBIDDEN",
      );
    }

    const assignment = await this.brandManagerService.getMyBrandManagerProfile(
      currentUser,
    );

    if (assignment.brandId !== campaign.brandId) {
      throw new ForbiddenError(
        "Brand managers can only update status for their own campaigns.",
        "CAMPAIGN_STATUS_FORBIDDEN",
      );
    }

    const brandManagerAllowedStatuses = [
      CampaignStatus.DRAFT,
      CampaignStatus.PENDING_APPROVAL,
      CampaignStatus.PAUSED,
      CampaignStatus.CANCELLED,
    ];

    if (!brandManagerAllowedStatuses.includes(status)) {
      throw new ForbiddenError(
        "Brand managers can only move campaigns between draft, pending approval, paused, and cancelled states.",
        "CAMPAIGN_STATUS_FORBIDDEN",
      );
    }

    const updatedCampaign = await this.campaignRepository.updateStatus(id, status);
    if (!updatedCampaign) {
      throw new NotFoundError("Campaign not found.", "CAMPAIGN_NOT_FOUND");
    }

    return updatedCampaign;
  }

  private buildQueryFilters(query: CampaignQueryDto, onlyActive = false) {
    const pagination = parsePaginationQuery(query);

    return {
      page: pagination.page,
      limit: pagination.limit,
      search: query.search?.trim() || undefined,
      status:
        onlyActive || query.status === undefined
          ? undefined
          : validateEnumValue(query.status, CAMPAIGN_STATUSES, "status"),
      objective:
        query.objective === undefined
          ? undefined
          : validateEnumValue(query.objective, CAMPAIGN_OBJECTIVES, "objective"),
      onlyActive,
    };
  }

  private normalizeCampaignPayload(
    dto: CreateCampaignDto | UpdateCampaignDto,
  ) {
    const objective =
      dto.objective === undefined
        ? undefined
        : validateEnumValue(dto.objective, CAMPAIGN_OBJECTIVES, "objective");
    const description = normalizeOptionalString(dto.description);
    const destinationUrl =
      dto.destinationUrl === undefined
        ? undefined
        : validateOptionalUrl(
            normalizeOptionalString(dto.destinationUrl),
            "destinationUrl",
          );
    const startDate = this.normalizeOptionalDate(dto.startDate, "startDate");
    const endDate = this.normalizeOptionalDate(dto.endDate, "endDate");
    const budget =
      dto.budget === undefined ? undefined : this.validateBudget(dto.budget);

    if (
      startDate !== undefined &&
      endDate !== undefined &&
      startDate !== null &&
      endDate !== null &&
      new Date(startDate).getTime() > new Date(endDate).getTime()
    ) {
      throw new BadRequestError(
        "startDate must be before endDate.",
        "CAMPAIGN_INVALID_DATE_RANGE",
      );
    }

    return {
      title:
        "title" in dto && dto.title !== undefined
          ? requireTrimmedString(dto.title, "title")
          : undefined,
      description,
      objective,
      budget,
      destinationUrl,
      startDate,
      endDate,
    };
  }

  private async getCreatorProfileOrThrow(currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can access creator campaign discovery.",
        "CAMPAIGN_ACCESS_FORBIDDEN",
      );
    }

    const creatorProfile = await this.creatorProfileRepository.findByUserId(
      currentUser.id,
    );

    if (!creatorProfile) {
      throw new NotFoundError(
        "Creator profile not found. Please complete your creator profile first.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    return creatorProfile;
  }

  private validateBudget(value: unknown) {
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
      throw new BadRequestError(
        "budget must be a non-negative number.",
        "CAMPAIGN_INVALID_BUDGET",
      );
    }

    return value;
  }

  private normalizeOptionalDate(value: unknown, field: string) {
    const normalizedValue = normalizeOptionalString(value);

    if (normalizedValue === undefined || normalizedValue === null) {
      return normalizedValue;
    }

    const date = new Date(normalizedValue);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError(`Invalid ${field}.`, "CAMPAIGN_INVALID_DATE", {
        field,
      });
    }

    return date.toISOString();
  }
}
