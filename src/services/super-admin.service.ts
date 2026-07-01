import { UserRole } from "../constants/roles.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  GetUsersWithRolesQuery,
  PlatformSummary,
  UpdateAdminUserRoleDto,
  UpdateAdminUserStatusDto,
} from "../interfaces/super-admin.interface.js";
import { BrandManagerRepository } from "../repositories/brand-manager.repository.js";
import { BrandRepository } from "../repositories/brand.repository.js";
import { CreatorProfileRepository } from "../repositories/creator-profile.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { UserService } from "./user.service.js";

export class SuperAdminService {
  constructor(
    private readonly userService: UserService,
    private readonly userRepository: UserRepository,
    private readonly brandRepository: BrandRepository,
    private readonly brandManagerRepository: BrandManagerRepository,
    private readonly creatorProfileRepository: CreatorProfileRepository,
  ) {}

  public async getPlatformSummary(currentUser: CurrentUser): Promise<PlatformSummary> {
    this.ensureSuperAdmin(currentUser);

    const [totalUsers, roleBreakdown, totalBrands, totalCreators, totalBrandManagers] =
      await Promise.all([
        this.userRepository.countAll(),
        this.userRepository.getRoleBreakdown(),
        this.brandRepository.countAll(),
        this.creatorProfileRepository.countAll(),
        this.brandManagerRepository.countAll(),
      ]);

    return {
      users: {
        total: totalUsers,
        byRole: roleBreakdown,
      },
      brands: {
        total: totalBrands,
      },
      creators: {
        total: totalCreators,
      },
      brandManagers: {
        total: totalBrandManagers,
      },
    };
  }

  public async getUsersWithRoles(
    query: GetUsersWithRolesQuery,
    currentUser: CurrentUser,
  ) {
    this.ensureSuperAdmin(currentUser);
    return this.userService.getUsers(query, currentUser);
  }

  public async getUserDetails(id: string, currentUser: CurrentUser) {
    this.ensureSuperAdmin(currentUser);
    return this.userService.getUserById(id, currentUser);
  }

  public async updateUserRole(
    id: string,
    dto: UpdateAdminUserRoleDto,
    currentUser: CurrentUser,
  ) {
    this.ensureSuperAdmin(currentUser);
    return this.userService.updateUserRole(id, dto, currentUser);
  }

  public async updateUserStatus(
    id: string,
    dto: UpdateAdminUserStatusDto,
    currentUser: CurrentUser,
  ) {
    this.ensureSuperAdmin(currentUser);
    return this.userService.updateUserStatus(id, dto, currentUser);
  }

  public async getRoleBreakdown(currentUser: CurrentUser) {
    this.ensureSuperAdmin(currentUser);
    return this.userRepository.getRoleBreakdown();
  }

  private ensureSuperAdmin(currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can access platform administration APIs.",
        "SUPER_ADMIN_ONLY",
      );
    }
  }
}
