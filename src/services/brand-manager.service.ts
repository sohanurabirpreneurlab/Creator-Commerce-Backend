import { AuthRepository } from "../repositories/auth.repository.js";
import { BrandManagerRepository } from "../repositories/brand-manager.repository.js";
import { BrandRepository } from "../repositories/brand.repository.js";
import { BrandManagerStatus, BRAND_MANAGER_STATUSES } from "../constants/brand-manager-status.js";
import { UserRole } from "../constants/roles.js";
import {
  AssignBrandManagerDto,
  BrandManagerListQuery,
  UpdateBrandManagerDto,
} from "../interfaces/brand-manager.interface.js";
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
} from "../utils/validation.js";

export class BrandManagerService {
  constructor(
    private readonly brandManagerRepository: BrandManagerRepository,
    private readonly brandRepository: BrandRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  public async assignBrandManager(
    dto: AssignBrandManagerDto,
    currentUser: CurrentUser,
  ) {
    this.ensureSuperAdmin(currentUser);

    const userId = requireTrimmedString(dto.userId, "userId");
    const brandId = requireTrimmedString(dto.brandId, "brandId");
    const designation = normalizeOptionalString(dto.designation) ?? null;

    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found.", "USER_NOT_FOUND");
    }

    if (user.role !== UserRole.BRAND_MANAGER) {
      throw new ConflictError(
        "Assigned user must have BRAND_MANAGER role.",
        "BRAND_MANAGER_ROLE_REQUIRED",
      );
    }

    const brand = await this.brandRepository.findById(brandId);
    if (!brand) {
      throw new NotFoundError("Brand not found.", "BRAND_NOT_FOUND");
    }

    const existingAssignment = await this.brandManagerRepository.findByUserAndBrand(
      userId,
      brandId,
    );
    if (existingAssignment) {
      throw new ConflictError(
        "This brand manager is already assigned to the brand.",
        "BRAND_MANAGER_ALREADY_ASSIGNED",
      );
    }

    return this.brandManagerRepository.create({
      userId,
      brandId,
      designation,
      status: BrandManagerStatus.ACTIVE,
      assignedBy: currentUser.id,
    });
  }

  public async getBrandManagerById(id: string, currentUser: CurrentUser) {
    const assignment = await this.brandManagerRepository.findById(id);
    if (!assignment) {
      throw new NotFoundError(
        "Brand manager assignment not found.",
        "BRAND_MANAGER_ASSIGNMENT_NOT_FOUND",
      );
    }

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return assignment;
    }

    if (currentUser.role === UserRole.BRAND_MANAGER && assignment.userId === currentUser.id) {
      return assignment;
    }

    throw new ForbiddenError(
      "You cannot view this brand manager assignment.",
      "BRAND_MANAGER_ACCESS_FORBIDDEN",
    );
  }

  public async getBrandManagers(
    query: BrandManagerListQuery,
    currentUser: CurrentUser,
  ) {
    this.ensureSuperAdmin(currentUser);

    const pagination = parsePaginationQuery(query);
    const status =
      query.status === undefined
        ? undefined
        : validateEnumValue(query.status, BRAND_MANAGER_STATUSES, "status");

    const result = await this.brandManagerRepository.findMany({
      page: pagination.page,
      limit: pagination.limit,
      status,
      brandId: query.brandId?.trim() || undefined,
      userId: query.userId?.trim() || undefined,
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

  public async getBrandManagersByBrand(brandId: string, currentUser: CurrentUser) {
    const normalizedBrandId = requireTrimmedString(brandId, "brandId");

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can list brand managers by brand.",
        "BRAND_MANAGER_ACCESS_FORBIDDEN",
      );
    }

    const brand = await this.brandRepository.findById(normalizedBrandId);
    if (!brand) {
      throw new NotFoundError("Brand not found.", "BRAND_NOT_FOUND");
    }

    return this.brandManagerRepository.findManyByBrandId(normalizedBrandId);
  }

  public async updateBrandManager(
    id: string,
    dto: UpdateBrandManagerDto,
    currentUser: CurrentUser,
  ) {
    this.ensureSuperAdmin(currentUser);

    const payload = {
      designation: normalizeOptionalString(dto.designation),
      status:
        dto.status === undefined
          ? undefined
          : validateEnumValue(dto.status, BRAND_MANAGER_STATUSES, "status"),
    };

    ensureAtLeastOneField(Object.values(payload));

    const updatedAssignment = await this.brandManagerRepository.update(id, payload);
    if (!updatedAssignment) {
      throw new NotFoundError(
        "Brand manager assignment not found.",
        "BRAND_MANAGER_ASSIGNMENT_NOT_FOUND",
      );
    }

    return updatedAssignment;
  }

  public async removeBrandManager(id: string, currentUser: CurrentUser) {
    this.ensureSuperAdmin(currentUser);

    const updatedAssignment = await this.brandManagerRepository.updateStatus(
      id,
      BrandManagerStatus.REMOVED,
    );

    if (!updatedAssignment) {
      throw new NotFoundError(
        "Brand manager assignment not found.",
        "BRAND_MANAGER_ASSIGNMENT_NOT_FOUND",
      );
    }

    return updatedAssignment;
  }

  public async getMyBrandManagerProfile(currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can access this profile.",
        "BRAND_MANAGER_ACCESS_FORBIDDEN",
      );
    }

    const assignments = await this.brandManagerRepository.findByUserId(currentUser.id);
    const activeAssignment = assignments.find(
      (assignment) => assignment.status === BrandManagerStatus.ACTIVE,
    );

    if (!activeAssignment) {
      throw new NotFoundError(
        "Brand manager assignment not found.",
        "BRAND_MANAGER_ASSIGNMENT_NOT_FOUND",
      );
    }

    return activeAssignment;
  }

  public async updateMyBrandManagerProfile(
    dto: {
      designation?: string;
    },
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can update their own assignment profile.",
        "BRAND_MANAGER_ACCESS_FORBIDDEN",
      );
    }

    const activeAssignment = await this.getMyBrandManagerProfile(currentUser);
    const designation =
      dto.designation !== undefined
        ? normalizeOptionalString(dto.designation)
        : undefined;

    ensureAtLeastOneField(
      [designation],
      "At least one brand manager field must be provided.",
    );

    const updatedAssignment = await this.brandManagerRepository.update(
      activeAssignment.id,
      {
        designation,
      },
    );

    if (!updatedAssignment) {
      throw new NotFoundError(
        "Brand manager assignment not found.",
        "BRAND_MANAGER_ASSIGNMENT_NOT_FOUND",
      );
    }

    return updatedAssignment;
  }

  private ensureSuperAdmin(currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can manage brand managers.",
        "BRAND_MANAGER_ADMIN_ONLY",
      );
    }
  }
}
