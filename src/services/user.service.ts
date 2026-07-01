import { UserRole } from "../constants/roles.js";
import { USER_STATUSES, UserStatus } from "../constants/profile.constants.js";
import { BadRequestError } from "../errors/bad-request-error.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  UpdateBasicUserProfileDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  UserListQuery,
} from "../interfaces/user.interface.js";
import { AuditLogRepository } from "../repositories/audit-log.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination.js";
import {
  ensureAtLeastOneField,
  requireTrimmedString,
  validateEnumValue,
} from "../utils/validation.js";

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogRepository?: AuditLogRepository,
  ) {}

  public async getUserProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found.", "USER_NOT_FOUND");
    }

    return user;
  }

  public async updateBasicProfile(
    userId: string,
    dto: UpdateBasicUserProfileDto,
  ) {
    const payload = {
      name:
        dto.name !== undefined ? requireTrimmedString(dto.name, "name") : undefined,
      mobileNumber:
        dto.mobileNumber !== undefined
          ? requireTrimmedString(dto.mobileNumber, "mobileNumber")
          : undefined,
      address:
        dto.address !== undefined
          ? requireTrimmedString(dto.address, "address")
          : undefined,
      gender:
        dto.gender !== undefined
          ? requireTrimmedString(dto.gender, "gender")
          : undefined,
      dateOfBirth:
        dto.dateOfBirth !== undefined
          ? requireTrimmedString(dto.dateOfBirth, "dateOfBirth")
          : undefined,
    };

    ensureAtLeastOneField(Object.values(payload));

    // This service intentionally limits generic profile editing to basic user
    // columns on the users table. Role-specific data still belongs to the
    // specialized services so we keep responsibilities separated.
    const updatedUser = await this.userRepository.updateBasicProfile(userId, payload);

    if (!updatedUser) {
      throw new NotFoundError("User not found.", "USER_NOT_FOUND");
    }

    return updatedUser;
  }

  public async getUsers(query: UserListQuery, currentUser: CurrentUser) {
    this.ensureSuperAdmin(currentUser);

    const pagination = parsePaginationQuery(query);
    const role =
      query.role === undefined
        ? undefined
        : validateEnumValue(query.role, Object.values(UserRole), "role");
    const status =
      query.status === undefined
        ? undefined
        : validateEnumValue(query.status, USER_STATUSES, "status");

    const result = await this.userRepository.findMany({
      page: pagination.page,
      limit: pagination.limit,
      search: query.search?.trim() || undefined,
      role,
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

  public async getUserById(id: string, currentUser: CurrentUser) {
    this.ensureSuperAdmin(currentUser);

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found.", "USER_NOT_FOUND");
    }

    return user;
  }

  public async updateUserRole(
    id: string,
    dto: UpdateUserRoleDto,
    currentUser: CurrentUser,
  ) {
    this.ensureSuperAdmin(currentUser);

    const normalizedUserId = requireTrimmedString(id, "id");
    const role = validateEnumValue(dto.role, Object.values(UserRole), "role");
    const existingUser = await this.userRepository.findById(normalizedUserId);

    if (!existingUser) {
      throw new NotFoundError("User not found.", "USER_NOT_FOUND");
    }

    if (
      currentUser.id === normalizedUserId &&
      role !== UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestError(
        "Super admins cannot demote themselves.",
        "SUPER_ADMIN_SELF_DEMOTION_BLOCKED",
      );
    }

    // Role updates only change the users.role column. They do not create brand
    // manager assignments or creator profiles automatically because those are
    // separate domain records with their own business rules and lifecycle.
    const updatedUser = await this.userRepository.updateRole(normalizedUserId, role);

    if (!updatedUser) {
      throw new NotFoundError("User not found.", "USER_NOT_FOUND");
    }

    await this.auditLogRepository?.create({
      actorUserId: currentUser.id,
      targetUserId: normalizedUserId,
      action: "USER_ROLE_UPDATED",
      oldValue: existingUser.role,
      newValue: updatedUser.role,
    });

    return updatedUser;
  }

  public async updateUserStatus(
    id: string,
    dto: UpdateUserStatusDto,
    currentUser: CurrentUser,
  ) {
    this.ensureSuperAdmin(currentUser);

    const normalizedUserId = requireTrimmedString(id, "id");
    const status = validateEnumValue(dto.status, USER_STATUSES, "status");
    const existingUser = await this.userRepository.findById(normalizedUserId);

    if (!existingUser) {
      throw new NotFoundError("User not found.", "USER_NOT_FOUND");
    }

    if (
      currentUser.id === normalizedUserId &&
      status !== UserStatus.ACTIVE
    ) {
      throw new BadRequestError(
        "Super admins cannot disable or suspend themselves.",
        "SUPER_ADMIN_SELF_STATUS_CHANGE_BLOCKED",
      );
    }

    const updatedUser = await this.userRepository.updateStatus(
      normalizedUserId,
      status,
    );

    if (!updatedUser) {
      throw new NotFoundError("User not found.", "USER_NOT_FOUND");
    }

    await this.auditLogRepository?.create({
      actorUserId: currentUser.id,
      targetUserId: normalizedUserId,
      action: "USER_STATUS_UPDATED",
      oldValue: existingUser.status,
      newValue: updatedUser.status,
    });

    return updatedUser;
  }

  private ensureSuperAdmin(currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can manage users.",
        "USER_ADMIN_ONLY",
      );
    }
  }
}
