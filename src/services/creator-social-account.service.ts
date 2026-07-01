import { UserRole } from "../constants/roles.js";
import { SOCIAL_PLATFORMS } from "../constants/social-platform.js";
import { ConflictError } from "../errors/conflict-error.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { ValidationError } from "../errors/validation-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  CreateCreatorSocialAccountDto,
  UpdateCreatorSocialAccountDto,
} from "../interfaces/creator-social-account.interface.js";
import { CreatorProfileRepository } from "../repositories/creator-profile.repository.js";
import { CreatorSocialAccountRepository } from "../repositories/creator-social-account.repository.js";
import {
  ensureAtLeastOneField,
  normalizeOptionalString,
  validateEnumValue,
  validateNonNegativeInteger,
  validateOptionalUrl,
  validatePercentage,
} from "../utils/validation.js";

export class CreatorSocialAccountService {
  constructor(
    private readonly creatorSocialAccountRepository: CreatorSocialAccountRepository,
    private readonly creatorProfileRepository: CreatorProfileRepository,
  ) {}

  public async addSocialAccount(
    dto: CreateCreatorSocialAccountDto,
    currentUser: CurrentUser,
  ) {
    const creatorProfile = await this.getOwnedCreatorProfile(currentUser);

    const platform = validateEnumValue(dto.platform, SOCIAL_PLATFORMS, "platform");
    const profileUrl = validateOptionalUrl(
      normalizeOptionalString(dto.profileUrl) ?? null,
      "profileUrl",
    );

    if (!profileUrl) {
      throw new ValidationError(
        "profileUrl is required.",
        "SOCIAL_ACCOUNT_URL_REQUIRED",
      );
    }

    const followersCount =
      dto.followersCount === undefined
        ? 0
        : validateNonNegativeInteger(dto.followersCount, "followersCount");
    const engagementRate =
      dto.engagementRate === undefined
        ? null
        : validatePercentage(dto.engagementRate, "engagementRate");
    const verified = dto.verified ?? false;

    const duplicate =
      await this.creatorSocialAccountRepository.findByCreatorPlatformAndUrl(
        creatorProfile.id,
        platform,
        profileUrl,
      );
    if (duplicate) {
      throw new ConflictError(
        "This social account already exists for the creator profile.",
        "SOCIAL_ACCOUNT_ALREADY_EXISTS",
      );
    }

    return this.creatorSocialAccountRepository.create({
      creatorProfileId: creatorProfile.id,
      platform,
      profileUrl,
      followersCount,
      engagementRate,
      verified,
    });
  }

  public async getMySocialAccounts(currentUser: CurrentUser) {
    const creatorProfile = await this.getOwnedCreatorProfile(currentUser);
    return this.creatorSocialAccountRepository.findManyByCreatorProfileId(
      creatorProfile.id,
    );
  }

  public async getMySocialAccountsOrEmpty(currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can access social accounts.",
        "CREATOR_ROLE_REQUIRED",
      );
    }

    const creatorProfile = await this.creatorProfileRepository.findByUserId(
      currentUser.id,
    );

    if (!creatorProfile) {
      return [];
    }

    return this.creatorSocialAccountRepository.findManyByCreatorProfileId(
      creatorProfile.id,
    );
  }

  public async updateSocialAccount(
    id: string,
    dto: UpdateCreatorSocialAccountDto,
    currentUser: CurrentUser,
  ) {
    const creatorProfile = await this.getOwnedCreatorProfile(currentUser);
    const socialAccount = await this.creatorSocialAccountRepository.findById(id);

    if (!socialAccount) {
      throw new NotFoundError(
        "Creator social account not found.",
        "CREATOR_SOCIAL_ACCOUNT_NOT_FOUND",
      );
    }

    if (socialAccount.creatorProfileId !== creatorProfile.id) {
      throw new ForbiddenError(
        "Creators can only update their own social accounts.",
        "CREATOR_SOCIAL_ACCOUNT_ACCESS_FORBIDDEN",
      );
    }

    const payload = {
      profileUrl: this.normalizeRequiredProfileUrlForUpdate(dto.profileUrl),
      followersCount:
        dto.followersCount !== undefined
          ? validateNonNegativeInteger(dto.followersCount, "followersCount")
          : undefined,
      engagementRate:
        dto.engagementRate !== undefined
          ? validatePercentage(dto.engagementRate, "engagementRate")
          : undefined,
      verified: dto.verified,
    };

    ensureAtLeastOneField(Object.values(payload));

    if (payload.profileUrl && payload.profileUrl !== socialAccount.profileUrl) {
      const duplicate =
        await this.creatorSocialAccountRepository.findByCreatorPlatformAndUrl(
          creatorProfile.id,
          socialAccount.platform,
          payload.profileUrl,
        );

      if (duplicate && duplicate.id !== socialAccount.id) {
        throw new ConflictError(
          "This social account already exists for the creator profile.",
          "SOCIAL_ACCOUNT_ALREADY_EXISTS",
        );
      }
    }

    const updatedAccount = await this.creatorSocialAccountRepository.update(
      socialAccount.id,
      payload,
    );

    if (!updatedAccount) {
      throw new NotFoundError(
        "Creator social account not found.",
        "CREATOR_SOCIAL_ACCOUNT_NOT_FOUND",
      );
    }

    return updatedAccount;
  }

  public async deleteSocialAccount(id: string, currentUser: CurrentUser) {
    const creatorProfile = await this.getOwnedCreatorProfile(currentUser);
    const socialAccount = await this.creatorSocialAccountRepository.findById(id);

    if (!socialAccount) {
      throw new NotFoundError(
        "Creator social account not found.",
        "CREATOR_SOCIAL_ACCOUNT_NOT_FOUND",
      );
    }

    if (socialAccount.creatorProfileId !== creatorProfile.id) {
      throw new ForbiddenError(
        "Creators can only delete their own social accounts.",
        "CREATOR_SOCIAL_ACCOUNT_ACCESS_FORBIDDEN",
      );
    }

    await this.creatorSocialAccountRepository.delete(socialAccount.id);

    return {
      deleted: true,
    };
  }

  public async getSocialAccountsByCreatorProfileId(
    creatorProfileId: string,
    currentUser: CurrentUser,
  ) {
    const creatorProfile = await this.creatorProfileRepository.findById(
      creatorProfileId,
    );
    if (!creatorProfile) {
      throw new NotFoundError(
        "Creator profile not found.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can view creator social accounts.",
        "CREATOR_SOCIAL_ACCOUNT_ACCESS_FORBIDDEN",
      );
    }

    return this.creatorSocialAccountRepository.findManyByCreatorProfileId(
      creatorProfileId,
    );
  }

  private async getOwnedCreatorProfile(currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can manage social accounts.",
        "CREATOR_ROLE_REQUIRED",
      );
    }

    // Social accounts are modeled as children of creator_profiles, so every
    // write first resolves the owner's profile instead of trusting client input.
    const creatorProfile = await this.creatorProfileRepository.findByUserId(
      currentUser.id,
    );

    if (!creatorProfile) {
      throw new NotFoundError(
        "Creator profile must exist before managing social accounts.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    return creatorProfile;
  }

  private normalizeRequiredProfileUrlForUpdate(profileUrl: unknown) {
    if (profileUrl === undefined) {
      return undefined;
    }

    const normalizedProfileUrl = validateOptionalUrl(
      normalizeOptionalString(profileUrl),
      "profileUrl",
    );

    if (!normalizedProfileUrl) {
      throw new ValidationError(
        "profileUrl cannot be empty.",
        "SOCIAL_ACCOUNT_URL_REQUIRED",
      );
    }

    return normalizedProfileUrl;
  }
}
