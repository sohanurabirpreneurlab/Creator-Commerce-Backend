import {
  BRAND_AMBASSADOR_SOURCES,
  BRAND_AMBASSADOR_STATUSES,
  BRAND_AMBASSADOR_TYPES,
  BrandAmbassadorSource,
  BrandAmbassadorStatus,
  BrandAmbassadorType,
} from "../constants/brand-ambassador.constants.js";
import { UserRole } from "../constants/roles.js";
import { UserStatus } from "../constants/profile.constants.js";
import { ConflictError } from "../errors/conflict-error.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  BrandAmbassadorQueryDto,
  CreateBrandAmbassadorDto,
  UpdateBrandAmbassadorDto,
  UpdateBrandAmbassadorStatusDto,
} from "../interfaces/brand-ambassador.interface.js";
import { BrandAmbassadorRepository } from "../repositories/brand-ambassador.repository.js";
import { CreatorProfileRepository } from "../repositories/creator-profile.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination.js";
import {
  ensureAtLeastOneField,
  normalizeOptionalString,
  requireTrimmedString,
  validateEnumValue,
} from "../utils/validation.js";
import { BrandManagerService } from "./brand-manager.service.js";

export class BrandAmbassadorService {
  constructor(
    private readonly brandAmbassadorRepository: BrandAmbassadorRepository,
    private readonly creatorProfileRepository: CreatorProfileRepository,
    private readonly brandManagerService: BrandManagerService,
    private readonly userRepository: UserRepository,
  ) {}

  public async createBrandAmbassador(
    dto: CreateBrandAmbassadorDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can add brand ambassadors.",
        "BRAND_AMBASSADOR_FORBIDDEN",
      );
    }

    const assignment = await this.brandManagerService.getMyBrandManagerProfile(
      currentUser,
    );
    const creatorProfileId = requireTrimmedString(
      dto.creatorProfileId,
      "creatorProfileId",
    );

    const creatorProfile = await this.creatorProfileRepository.findById(creatorProfileId);
    if (!creatorProfile) {
      throw new NotFoundError(
        "Creator profile not found.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    const creatorUser = await this.userRepository.findById(creatorProfile.userId);
    if (!creatorUser) {
      throw new NotFoundError("User not found.", "USER_NOT_FOUND");
    }

    if (creatorUser.status !== UserStatus.ACTIVE) {
      throw new ConflictError(
        "Only active creators can be added as ambassadors.",
        "BRAND_AMBASSADOR_CREATOR_NOT_ACTIVE",
      );
    }

    const existingAmbassador =
      await this.brandAmbassadorRepository.findByBrandAndCreator(
        assignment.brandId,
        creatorProfileId,
      );

    if (
      existingAmbassador &&
      existingAmbassador.status !== BrandAmbassadorStatus.REMOVED
    ) {
      throw new ConflictError(
        "This creator is already assigned to the brand ambassador roster.",
        "BRAND_AMBASSADOR_ALREADY_EXISTS",
      );
    }

    if (existingAmbassador) {
      const reactivated = await this.brandAmbassadorRepository.updateStatus(
        existingAmbassador.id,
        BrandAmbassadorStatus.ACTIVE,
      );

      await this.brandAmbassadorRepository.update(existingAmbassador.id, {
        ambassadorType:
          dto.ambassadorType === undefined
            ? existingAmbassador.ambassadorType
            : validateEnumValue(
                dto.ambassadorType,
                BRAND_AMBASSADOR_TYPES,
                "ambassadorType",
              ),
        notes: normalizeOptionalString(dto.notes) ?? null,
      });

      return this.brandAmbassadorRepository.findDetailedById(
        reactivated?.id ?? existingAmbassador.id,
      );
    }

    const ambassador = await this.brandAmbassadorRepository.create({
      brandId: assignment.brandId,
      creatorProfileId,
      status: BrandAmbassadorStatus.ACTIVE,
      ambassadorType:
        dto.ambassadorType === undefined
          ? BrandAmbassadorType.LONG_TERM
          : validateEnumValue(dto.ambassadorType, BRAND_AMBASSADOR_TYPES, "ambassadorType"),
      source:
        dto.source === undefined
          ? BrandAmbassadorSource.ADDED_BY_BRAND
          : validateEnumValue(dto.source, BRAND_AMBASSADOR_SOURCES, "source"),
      assignedBy: currentUser.id,
      notes: normalizeOptionalString(dto.notes) ?? null,
    });

    return this.brandAmbassadorRepository.findDetailedById(ambassador.id);
  }

  public async getBrandAmbassadors(
    query: BrandAmbassadorQueryDto,
    currentUser: CurrentUser,
  ) {
    const filters = this.buildFilters(query);

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      const assignment = await this.brandManagerService.getMyBrandManagerProfile(
        currentUser,
      );
      const result = await this.brandAmbassadorRepository.findManyByBrandId(
        assignment.brandId,
        filters,
      );

      return {
        data: result.data,
        meta: createPaginationMeta(filters.page, filters.limit, result.total),
      };
    }

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const result = await this.brandAmbassadorRepository.findMany(filters);

      return {
        data: result.data,
        meta: createPaginationMeta(filters.page, filters.limit, result.total),
      };
    }

    throw new ForbiddenError(
      "You do not have access to brand ambassadors.",
      "BRAND_AMBASSADOR_FORBIDDEN",
    );
  }

  public async getBrandAmbassadorById(id: string, currentUser: CurrentUser) {
    const ambassador = await this.brandAmbassadorRepository.findDetailedById(id);
    if (!ambassador) {
      throw new NotFoundError(
        "Brand ambassador not found.",
        "BRAND_AMBASSADOR_NOT_FOUND",
      );
    }

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return ambassador;
    }

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      const assignment = await this.brandManagerService.getMyBrandManagerProfile(
        currentUser,
      );

      if (assignment.brandId !== ambassador.brand.id) {
        throw new ForbiddenError(
          "Brand managers can only access ambassadors for their assigned brand.",
          "BRAND_AMBASSADOR_FORBIDDEN",
        );
      }

      return ambassador;
    }

    throw new ForbiddenError(
      "Creators cannot access brand ambassador management.",
      "BRAND_AMBASSADOR_FORBIDDEN",
    );
  }

  public async updateBrandAmbassador(
    id: string,
    dto: UpdateBrandAmbassadorDto,
    currentUser: CurrentUser,
  ) {
    const ambassador = await this.getBrandAmbassadorById(id, currentUser);

    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can update ambassador details.",
        "BRAND_AMBASSADOR_FORBIDDEN",
      );
    }

    const payload = {
      ambassadorType:
        dto.ambassadorType === undefined
          ? undefined
          : validateEnumValue(
              dto.ambassadorType,
              BRAND_AMBASSADOR_TYPES,
              "ambassadorType",
            ),
      notes:
        dto.notes !== undefined ? normalizeOptionalString(dto.notes) ?? null : undefined,
    };

    ensureAtLeastOneField(Object.values(payload));

    await this.brandAmbassadorRepository.update(ambassador.id, payload);
    return this.brandAmbassadorRepository.findDetailedById(ambassador.id);
  }

  public async updateBrandAmbassadorStatus(
    id: string,
    dto: UpdateBrandAmbassadorStatusDto,
    currentUser: CurrentUser,
  ) {
    const ambassador = await this.getBrandAmbassadorById(id, currentUser);
    const status = validateEnumValue(dto.status, BRAND_AMBASSADOR_STATUSES, "status");

    if (
      currentUser.role !== UserRole.BRAND_MANAGER &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenError(
        "You do not have access to update ambassador status.",
        "BRAND_AMBASSADOR_FORBIDDEN",
      );
    }

    await this.brandAmbassadorRepository.updateStatus(ambassador.id, status);
    return this.brandAmbassadorRepository.findDetailedById(ambassador.id);
  }

  public async removeBrandAmbassador(id: string, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can remove ambassadors.",
        "BRAND_AMBASSADOR_FORBIDDEN",
      );
    }

    const ambassador = await this.getBrandAmbassadorById(id, currentUser);
    await this.brandAmbassadorRepository.updateStatus(
      ambassador.id,
      BrandAmbassadorStatus.REMOVED,
    );

    return this.brandAmbassadorRepository.findDetailedById(ambassador.id);
  }

  private buildFilters(query: BrandAmbassadorQueryDto) {
    const pagination = parsePaginationQuery(query);

    return {
      page: pagination.page,
      limit: pagination.limit,
      search: query.search?.trim() || undefined,
      status:
        query.status === undefined
          ? undefined
          : validateEnumValue(query.status, BRAND_AMBASSADOR_STATUSES, "status"),
    };
  }
}
