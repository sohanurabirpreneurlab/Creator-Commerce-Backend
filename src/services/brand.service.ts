import { AuthRepository } from "../repositories/auth.repository.js";
import { BrandRepository } from "../repositories/brand.repository.js";
import { BrandManagerRepository } from "../repositories/brand-manager.repository.js";
import { BrandStatus, BRAND_STATUSES } from "../constants/brand-status.js";
import { UserRole } from "../constants/roles.js";
import {
  BrandListQuery,
  CreateBrandDto,
  UpdateBrandDto,
  UpdateBrandStatusDto,
} from "../interfaces/brand.interface.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { ConflictError } from "../errors/conflict-error.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination.js";
import {
  ensureAtLeastOneField,
  normalizeOptionalString,
  requireTrimmedString,
  validateEnumValue,
  validateOptionalEmail,
  validateOptionalUrl,
} from "../utils/validation.js";

export class BrandService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly brandManagerRepository: BrandManagerRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  public async createBrand(dto: CreateBrandDto, currentUser: CurrentUser) {
    this.ensureSuperAdmin(currentUser, "Only super admins can create brands.");

    const name = requireTrimmedString(dto.name, "name");
    const industry = normalizeOptionalString(dto.industry) ?? null;
    const website = validateOptionalUrl(
      normalizeOptionalString(dto.website) ?? null,
      "website",
    );
    const logoUrl = validateOptionalUrl(
      normalizeOptionalString(dto.logoUrl) ?? null,
      "logoUrl",
    );
    const contactEmail = validateOptionalEmail(
      normalizeOptionalString(dto.contactEmail) ?? null,
      "contactEmail",
    );

    const brandExists = await this.brandRepository.existsByName(name);
    if (brandExists) {
      throw new ConflictError(
        "A brand already exists with this name.",
        "BRAND_NAME_ALREADY_EXISTS",
      );
    }

    return this.brandRepository.create({
      name,
      industry,
      website,
      logoUrl,
      contactEmail,
      status: BrandStatus.PENDING,
      createdBy: currentUser.id,
    });
  }

  public async getBrandById(id: string, currentUser: CurrentUser) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundError("Brand not found.", "BRAND_NOT_FOUND");
    }

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return brand;
    }

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      const assignment = await this.getActiveAssignmentForBrandManager(currentUser.id);

      if (assignment.brandId !== brand.id) {
        throw new ForbiddenError(
          "Brand managers can only access their assigned brand.",
          "BRAND_ACCESS_FORBIDDEN",
        );
      }

      return brand;
    }

    throw new ForbiddenError(
      "Creators cannot access brand details.",
      "BRAND_ACCESS_FORBIDDEN",
    );
  }

  public async getBrands(query: BrandListQuery, currentUser: CurrentUser) {
    this.ensureSuperAdmin(currentUser, "Only super admins can list brands.");

    const pagination = parsePaginationQuery(query);
    const status =
      query.status === undefined
        ? undefined
        : validateEnumValue(query.status, BRAND_STATUSES, "status");

    const result = await this.brandRepository.findMany({
      page: pagination.page,
      limit: pagination.limit,
      search: query.search?.trim() || undefined,
      status,
    });

    return {
      data: result.data,
      meta: createPaginationMeta(
        pagination.page,
        pagination.limit,
        result.total,
      ),
    };
  }

  public async updateBrand(
    id: string,
    dto: UpdateBrandDto,
    currentUser: CurrentUser,
  ) {
    const brand = await this.brandRepository.findById(id);
    if (!brand) {
      throw new NotFoundError("Brand not found.", "BRAND_NOT_FOUND");
    }

    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
    const isBrandManager = currentUser.role === UserRole.BRAND_MANAGER;

    if (!isSuperAdmin && !isBrandManager) {
      throw new ForbiddenError(
        "Creators cannot update brands.",
        "BRAND_UPDATE_FORBIDDEN",
      );
    }

    if (isBrandManager) {
      const assignment = await this.getActiveAssignmentForBrandManager(currentUser.id);

      if (assignment.brandId !== id) {
        throw new ForbiddenError(
          "Brand managers can only update their assigned brand.",
          "BRAND_UPDATE_FORBIDDEN",
        );
      }
    }

    const payload = {
      name:
        dto.name !== undefined ? requireTrimmedString(dto.name, "name") : undefined,
      industry: normalizeOptionalString(dto.industry),
      website:
        dto.website !== undefined
          ? validateOptionalUrl(normalizeOptionalString(dto.website), "website")
          : undefined,
      logoUrl:
        dto.logoUrl !== undefined
          ? validateOptionalUrl(normalizeOptionalString(dto.logoUrl), "logoUrl")
          : undefined,
      contactEmail:
        dto.contactEmail !== undefined
          ? validateOptionalEmail(
              normalizeOptionalString(dto.contactEmail),
              "contactEmail",
            )
          : undefined,
    };

    ensureAtLeastOneField(Object.values(payload));

    if (payload.name) {
      const brandExists = await this.brandRepository.existsByName(payload.name, id);
      if (brandExists) {
        throw new ConflictError(
          "A brand already exists with this name.",
          "BRAND_NAME_ALREADY_EXISTS",
        );
      }
    }

    const updatedBrand = await this.brandRepository.update(id, payload);
    if (!updatedBrand) {
      throw new NotFoundError("Brand not found.", "BRAND_NOT_FOUND");
    }

    return updatedBrand;
  }

  public async updateBrandStatus(
    id: string,
    dto: UpdateBrandStatusDto,
    currentUser: CurrentUser,
  ) {
    this.ensureSuperAdmin(
      currentUser,
      "Only super admins can update brand status.",
    );

    const status = validateEnumValue(dto.status, BRAND_STATUSES, "status");
    const updatedBrand = await this.brandRepository.updateStatus(id, status);

    if (!updatedBrand) {
      throw new NotFoundError("Brand not found.", "BRAND_NOT_FOUND");
    }

    return updatedBrand;
  }

  public async getMyBrand(currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can access their brand profile.",
        "BRAND_PROFILE_FORBIDDEN",
      );
    }

    const assignment = await this.getActiveAssignmentForBrandManager(currentUser.id);
    const brand = await this.brandRepository.findById(assignment.brandId);

    if (!brand) {
      throw new NotFoundError(
        "Assigned brand could not be found.",
        "BRAND_NOT_FOUND",
      );
    }

    return brand;
  }

  public async updateMyBrand(dto: UpdateBrandDto, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can update their own brand profile.",
        "BRAND_PROFILE_FORBIDDEN",
      );
    }

    const assignment = await this.getActiveAssignmentForBrandManager(currentUser.id);
    return this.updateBrand(assignment.brandId, dto, currentUser);
  }

  private ensureSuperAdmin(currentUser: CurrentUser, message: string) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(message, "BRAND_ADMIN_ONLY");
    }
  }

  private async getActiveAssignmentForBrandManager(userId: string) {
    // We fetch the user record as a defensive check so the service does not
    // silently operate on a token for a deleted or role-changed user.
    const user = await this.authRepository.findById(userId);
    if (!user || user.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "This user is not an active brand manager.",
        "BRAND_MANAGER_ROLE_REQUIRED",
      );
    }

    const assignments = await this.brandManagerRepository.findByUserId(userId);
    const activeAssignment = assignments.find(
      (assignment) => assignment.status !== "REMOVED" && assignment.status !== "INACTIVE",
    );

    if (!activeAssignment) {
      throw new NotFoundError(
        "No active brand assignment found for this brand manager.",
        "BRAND_MANAGER_ASSIGNMENT_NOT_FOUND",
      );
    }

    return activeAssignment;
  }
}
