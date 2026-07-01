import { UserRole } from "../constants/roles.js";
import {
  CreatorVerificationStatus,
  CREATOR_VERIFICATION_STATUSES,
} from "../constants/creator-verification-status.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { BadRequestError } from "../errors/bad-request-error.js";
import {
  CreateCreatorProfileDto,
  CreatorProfileListQuery,
  UpdateCreatorProfileDto,
  UpdateCreatorVerificationStatusDto,
} from "../interfaces/creator-profile.interface.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { CreatorProfileRepository } from "../repositories/creator-profile.repository.js";
import { ConflictError } from "../errors/conflict-error.js";
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination.js";
import {
  ensureAtLeastOneField,
  normalizeOptionalString,
  requireTrimmedString,
  validateEnumValue,
  validateOptionalUrl,
} from "../utils/validation.js";

export class CreatorProfileService {
  constructor(private readonly creatorProfileRepository: CreatorProfileRepository) {}

  public async createMyProfile(
    dto: CreateCreatorProfileDto,
    currentUser: CurrentUser,
  ) {
    this.ensureCreator(currentUser, "Only creators can create creator profiles.");

    const alreadyExists = await this.creatorProfileRepository.existsByUserId(
      currentUser.id,
    );
    if (alreadyExists) {
      throw new ConflictError(
        "A creator profile already exists for this user.",
        "CREATOR_PROFILE_ALREADY_EXISTS",
      );
    }

    return this.creatorProfileRepository.create({
      userId: currentUser.id,
      displayName: requireTrimmedString(dto.displayName, "displayName"),
      bio: normalizeOptionalString(dto.bio) ?? null,
      category: normalizeOptionalString(dto.category) ?? null,
      location: normalizeOptionalString(dto.location) ?? null,
      profileImageUrl: validateOptionalUrl(
        normalizeOptionalString(dto.profileImageUrl) ?? null,
        "profileImageUrl",
      ),
      verificationStatus: CreatorVerificationStatus.PENDING,
    });
  }

  public async getMyProfile(currentUser: CurrentUser) {
    this.ensureCreator(currentUser, "Only creators can access their own profile.");

    const profile = await this.creatorProfileRepository.findByUserId(currentUser.id);
    if (!profile) {
      throw new NotFoundError(
        "Creator profile not found.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    return profile;
  }

  public async getMyProfileOrNull(currentUser: CurrentUser) {
    this.ensureCreator(currentUser, "Only creators can access their own profile.");
    return this.creatorProfileRepository.findByUserId(currentUser.id);
  }

  public async updateMyProfile(
    dto: UpdateCreatorProfileDto,
    currentUser: CurrentUser,
  ) {
    this.ensureCreator(currentUser, "Only creators can update their own profile.");

    const profile = await this.creatorProfileRepository.findByUserId(currentUser.id);
    if (!profile) {
      throw new NotFoundError(
        "Creator profile not found.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    const payload = {
      displayName:
        dto.displayName !== undefined
          ? requireTrimmedString(dto.displayName, "displayName")
          : undefined,
      bio: normalizeOptionalString(dto.bio),
      category: normalizeOptionalString(dto.category),
      location: normalizeOptionalString(dto.location),
      profileImageUrl:
        dto.profileImageUrl !== undefined
          ? validateOptionalUrl(
              normalizeOptionalString(dto.profileImageUrl),
              "profileImageUrl",
            )
          : undefined,
    };

    ensureAtLeastOneField(Object.values(payload));

    const updatedProfile = await this.creatorProfileRepository.update(
      profile.id,
      payload,
    );

    if (!updatedProfile) {
      throw new NotFoundError(
        "Creator profile not found.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    return updatedProfile;
  }

  public async upsertMyProfile(
    dto: UpdateCreatorProfileDto,
    currentUser: CurrentUser,
  ) {
    this.ensureCreator(currentUser, "Only creators can update their own profile.");

    const existingProfile = await this.creatorProfileRepository.findByUserId(
      currentUser.id,
    );

    if (existingProfile) {
      return this.updateMyProfile(dto, currentUser);
    }

    // The generic /api/profile endpoint can create the creator profile on first
    // update, but only when enough information exists to satisfy the creator
    // profile invariants. Right now displayName is the minimum required field.
    if (!dto.displayName?.trim()) {
      throw new BadRequestError(
        "Creator profile does not exist yet. Provide creatorProfile.displayName to create it first.",
        "CREATOR_PROFILE_CREATE_REQUIRES_DISPLAY_NAME",
      );
    }

    return this.createMyProfile(
      {
        displayName: dto.displayName,
        bio: dto.bio,
        category: dto.category,
        location: dto.location,
        profileImageUrl: dto.profileImageUrl,
      },
      currentUser,
    );
  }

  public async getCreatorProfileById(id: string, currentUser: CurrentUser) {
    const profile = await this.creatorProfileRepository.findById(id);
    if (!profile) {
      throw new NotFoundError(
        "Creator profile not found.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    // The corrected design keeps creator discovery under explicit admin APIs
    // for now. If brand managers need creator browsing later, we can open that
    // permission in one place without changing creator ownership rules.
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return profile;
    }

    if (currentUser.role === UserRole.CREATOR && profile.userId === currentUser.id) {
      return profile;
    }

    throw new ForbiddenError(
      "Creators can only access their own profile.",
      "CREATOR_PROFILE_ACCESS_FORBIDDEN",
    );
  }

  public async getCreators(query: CreatorProfileListQuery, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can list creator profiles.",
        "CREATOR_PROFILE_LIST_FORBIDDEN",
      );
    }

    const pagination = parsePaginationQuery(query);
    const verificationStatus =
      query.verificationStatus === undefined
        ? undefined
        : validateEnumValue(
            query.verificationStatus,
            CREATOR_VERIFICATION_STATUSES,
            "verificationStatus",
          );

    const result = await this.creatorProfileRepository.findMany({
      page: pagination.page,
      limit: pagination.limit,
      search: query.search?.trim() || undefined,
      category: query.category?.trim() || undefined,
      verificationStatus,
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

  public async updateVerificationStatus(
    id: string,
    dto: UpdateCreatorVerificationStatusDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can update creator verification status.",
        "CREATOR_STATUS_UPDATE_FORBIDDEN",
      );
    }

    const verificationStatus = validateEnumValue(
      dto.verificationStatus,
      CREATOR_VERIFICATION_STATUSES,
      "verificationStatus",
    );

    const updatedProfile =
      await this.creatorProfileRepository.updateVerificationStatus(
        requireTrimmedString(id, "id"),
        verificationStatus,
      );

    if (!updatedProfile) {
      throw new NotFoundError(
        "Creator profile not found.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    return updatedProfile;
  }

  private ensureCreator(currentUser: CurrentUser, message: string) {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(message, "CREATOR_ROLE_REQUIRED");
    }
  }
}
