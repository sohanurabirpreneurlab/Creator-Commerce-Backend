import { UserRole } from "../constants/roles.js";
import { BadRequestError } from "../errors/bad-request-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { ProfileResponse, UpdateMyProfileDto } from "../interfaces/profile.interface.js";
import { BrandManagerService } from "./brand-manager.service.js";
import { BrandService } from "./brand.service.js";
import { ProfileCompletionService } from "./profile-completion.service.js";
import { CreatorProfileService } from "./creator-profile.service.js";
import { CreatorSocialAccountService } from "./creator-social-account.service.js";
import { UserService } from "./user.service.js";

export class ProfileService {
  constructor(
    private readonly creatorProfileService: CreatorProfileService,
    private readonly creatorSocialAccountService: CreatorSocialAccountService,
    private readonly brandService: BrandService,
    private readonly brandManagerService: BrandManagerService,
    private readonly userService: UserService,
    private readonly profileCompletionService: ProfileCompletionService,
  ) {}

  public async getMyProfile(currentUser: CurrentUser): Promise<ProfileResponse> {
    // This service is intentionally a thin orchestrator. It decides which
    // specialized service owns the profile shape for the current role, but it
    // does not implement creator, brand, or admin business rules itself.
    if (currentUser.role === UserRole.CREATOR) {
      const [user, creatorProfile, socialAccounts] = await Promise.all([
        this.userService.getUserProfile(currentUser.id),
        this.creatorProfileService.getMyProfileOrNull(currentUser),
        this.creatorSocialAccountService.getMySocialAccountsOrEmpty(currentUser),
      ]);

      return {
        user,
        role: currentUser.role,
        profileType: "CREATOR_PROFILE",
        creatorProfile,
        socialAccounts,
        completion: this.profileCompletionService.calculateCompletion(
          currentUser.role,
          {
            user,
            creatorProfile,
            socialAccounts,
          },
        ),
      };
    }

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      const [user, brandManager, brand] = await Promise.all([
        this.userService.getUserProfile(currentUser.id),
        this.brandManagerService.getMyBrandManagerProfile(currentUser),
        this.brandService.getMyBrand(currentUser),
      ]);

      return {
        user,
        role: currentUser.role,
        profileType: "BRAND_MANAGER_PROFILE",
        brandManager,
        brand,
        completion: this.profileCompletionService.calculateCompletion(
          currentUser.role,
          {
            user,
            brandManager,
            brand,
          },
        ),
      };
    }

    const user = await this.userService.getUserProfile(currentUser.id);

    return {
      user,
      role: currentUser.role,
      profileType: "SUPER_ADMIN_PROFILE",
      completion: this.profileCompletionService.calculateCompletion(
        currentUser.role,
        {
          user,
        },
      ),
    };
  }

  public async updateMyProfile(
    dto: UpdateMyProfileDto,
    currentUser: CurrentUser,
  ): Promise<ProfileResponse> {
    this.rejectReadOnlyFields(dto);

    // The generic profile endpoint updates only the fields appropriate for the
    // current role, then rehydrates the final role-specific response via
    // getMyProfile so callers always receive a consistent shape.
    if (currentUser.role === UserRole.CREATOR) {
      this.rejectUnsupportedProfileFields(dto, ["user", "creatorProfile"]);

      if (dto.user) {
        await this.userService.updateBasicProfile(currentUser.id, dto.user);
      }

      if (dto.creatorProfile) {
        await this.creatorProfileService.upsertMyProfile(
          dto.creatorProfile,
          currentUser,
        );
      }

      if (!dto.user && !dto.creatorProfile) {
        throw new BadRequestError(
          "Provide user or creatorProfile fields to update.",
          "PROFILE_UPDATE_EMPTY_PAYLOAD",
        );
      }

      return this.getMyProfile(currentUser);
    }

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      this.rejectUnsupportedProfileFields(dto, ["user", "brandManager", "brand"]);

      if (dto.user) {
        await this.userService.updateBasicProfile(currentUser.id, dto.user);
      }

      if (dto.brandManager) {
        await this.brandManagerService.updateMyBrandManagerProfile(
          dto.brandManager,
          currentUser,
        );
      }

      if (dto.brand) {
        await this.brandService.updateMyBrand(dto.brand, currentUser);
      }

      if (!dto.user && !dto.brandManager && !dto.brand) {
        throw new BadRequestError(
          "Provide user, brandManager, or brand fields to update.",
          "PROFILE_UPDATE_EMPTY_PAYLOAD",
        );
      }

      return this.getMyProfile(currentUser);
    }

    this.rejectUnsupportedProfileFields(dto, ["user"]);

    if (!dto.user) {
      throw new BadRequestError(
        "Provide user fields to update.",
        "PROFILE_UPDATE_EMPTY_PAYLOAD",
      );
    }

    await this.userService.updateBasicProfile(currentUser.id, dto.user);
    return this.getMyProfile(currentUser);
  }

  private rejectUnsupportedProfileFields(
    dto: UpdateMyProfileDto,
    allowedKeys: Array<keyof UpdateMyProfileDto>,
  ) {
    const unsupportedKeys = Object.keys(dto).filter(
      (key) => !allowedKeys.includes(key as keyof UpdateMyProfileDto),
    );

    if (unsupportedKeys.length > 0) {
      throw new BadRequestError(
        "Unsupported profile update fields were provided.",
        "PROFILE_UPDATE_UNSUPPORTED_FIELDS",
        {
          unsupportedKeys,
        },
      );
    }
  }

  private rejectReadOnlyFields(dto: UpdateMyProfileDto) {
    const readOnlyFieldErrors: string[] = [];
    const userPayload = dto.user as Record<string, unknown> | undefined;
    const creatorPayload = dto.creatorProfile as Record<string, unknown> | undefined;
    const brandManagerPayload = dto.brandManager as Record<string, unknown> | undefined;
    const brandPayload = dto.brand as Record<string, unknown> | undefined;

    if (userPayload) {
      for (const field of ["email", "role", "status"]) {
        if (field in userPayload) {
          readOnlyFieldErrors.push(`user.${field}`);
        }
      }
    }

    if (creatorPayload && "verificationStatus" in creatorPayload) {
      readOnlyFieldErrors.push("creatorProfile.verificationStatus");
    }

    if (brandManagerPayload && "status" in brandManagerPayload) {
      readOnlyFieldErrors.push("brandManager.status");
    }

    if (brandPayload && "status" in brandPayload) {
      readOnlyFieldErrors.push("brand.status");
    }

    if (readOnlyFieldErrors.length > 0) {
      throw new BadRequestError(
        "Read-only profile fields cannot be updated from this endpoint.",
        "PROFILE_UPDATE_READ_ONLY_FIELDS",
        {
          fields: readOnlyFieldErrors,
        },
      );
    }
  }
}
