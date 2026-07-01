import { UserRole } from "../constants/roles.js";
import {
  CONTENT_SUBMISSION_STATUSES,
  ContentSubmissionStatus,
} from "../constants/campaign.constants.js";
import { NotificationType } from "../constants/notification.constants.js";
import { BadRequestError } from "../errors/bad-request-error.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  ContentSubmissionQueryDto,
  ReviewContentSubmissionDto,
  UpdateContentSubmissionStatusDto,
} from "../interfaces/content-submission.interface.js";
import { ContentSubmissionRepository } from "../repositories/content-submission.repository.js";
import { CreatorProfileRepository } from "../repositories/creator-profile.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination.js";
import {
  normalizeOptionalString,
  validateEnumValue,
} from "../utils/validation.js";
import { BrandManagerService } from "./brand-manager.service.js";
import { NotificationService } from "./notification.service.js";

export class ContentSubmissionService {
  constructor(
    private readonly contentSubmissionRepository: ContentSubmissionRepository,
    private readonly creatorProfileRepository: CreatorProfileRepository,
    private readonly brandManagerService: BrandManagerService,
    private readonly notificationService: NotificationService,
    private readonly userRepository: UserRepository,
  ) {}

  public async getMyContentSubmissions(
    query: ContentSubmissionQueryDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can view content submissions.",
        "CONTENT_SUBMISSION_FORBIDDEN",
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

    const filters = this.buildFilters(query);
    const result = await this.contentSubmissionRepository.findManyByCreatorProfileId(
      creatorProfile.id,
      filters,
    );

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async getBrandContentSubmissions(
    query: ContentSubmissionQueryDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can view content submissions for their brand.",
        "CONTENT_SUBMISSION_FORBIDDEN",
      );
    }

    const assignment = await this.brandManagerService.getMyBrandManagerProfile(
      currentUser,
    );
    const filters = this.buildFilters(query);
    const result = await this.contentSubmissionRepository.findManyByBrandId(
      assignment.brandId,
      filters,
    );

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async getAdminContentSubmissions(
    query: ContentSubmissionQueryDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can view all content submissions.",
        "CONTENT_SUBMISSION_FORBIDDEN",
      );
    }

    const filters = this.buildFilters(query);
    const result = await this.contentSubmissionRepository.findMany(filters);

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async getContentSubmissionById(id: string, currentUser: CurrentUser) {
    const submission = await this.contentSubmissionRepository.findDetailedById(id);
    if (!submission) {
      throw new NotFoundError(
        "Content submission not found.",
        "CONTENT_SUBMISSION_NOT_FOUND",
      );
    }

    if (currentUser.role === UserRole.CREATOR) {
      const creatorProfile = await this.creatorProfileRepository.findByUserId(
        currentUser.id,
      );

      if (!creatorProfile || creatorProfile.id !== submission.creatorProfileId) {
        throw new ForbiddenError(
          "Creators can only access their own content submissions.",
          "CONTENT_SUBMISSION_FORBIDDEN",
        );
      }

      return submission;
    }

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      const assignment = await this.brandManagerService.getMyBrandManagerProfile(
        currentUser,
      );

      if (submission.brand.id !== assignment.brandId) {
        throw new ForbiddenError(
          "Brand managers can only review content for their assigned brand.",
          "CONTENT_SUBMISSION_FORBIDDEN",
        );
      }

      return submission;
    }

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return submission;
    }

    throw new ForbiddenError(
      "You do not have access to this content submission.",
      "CONTENT_SUBMISSION_FORBIDDEN",
    );
  }

  public async approveSubmission(id: string, currentUser: CurrentUser) {
    return this.reviewSubmission(
      id,
      {
        status: ContentSubmissionStatus.APPROVED,
      },
      currentUser,
    );
  }

  public async rejectSubmission(
    id: string,
    dto: ReviewContentSubmissionDto,
    currentUser: CurrentUser,
  ) {
    return this.reviewSubmission(
      id,
      {
        status: ContentSubmissionStatus.REJECTED,
        reviewComment: dto.reviewComment,
      },
      currentUser,
    );
  }

  public async requestChanges(
    id: string,
    dto: ReviewContentSubmissionDto,
    currentUser: CurrentUser,
  ) {
    return this.reviewSubmission(
      id,
      {
        status: ContentSubmissionStatus.CHANGE_REQUESTED,
        reviewComment: dto.reviewComment,
      },
      currentUser,
    );
  }

  public async adminUpdateSubmissionStatus(
    id: string,
    dto: UpdateContentSubmissionStatusDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can override content submission status.",
        "CONTENT_SUBMISSION_FORBIDDEN",
      );
    }

    return this.reviewSubmission(
      id,
      {
        status: validateEnumValue(dto.status, CONTENT_SUBMISSION_STATUSES, "status"),
        reviewComment: dto.reviewComment,
      },
      currentUser,
    );
  }

  private buildFilters(query: ContentSubmissionQueryDto) {
    const pagination = parsePaginationQuery(query);

    return {
      page: pagination.page,
      limit: pagination.limit,
      search: query.search?.trim() || undefined,
      status:
        query.status === undefined
          ? undefined
          : validateEnumValue(
              query.status,
              CONTENT_SUBMISSION_STATUSES,
              "status",
            ),
    };
  }

  private async reviewSubmission(
    id: string,
    dto: { status: ContentSubmissionStatus; reviewComment?: string },
    currentUser: CurrentUser,
  ) {
    const submission = await this.getContentSubmissionById(id, currentUser);
    const reviewComment = normalizeOptionalString(dto.reviewComment) ?? null;

    if (
      (dto.status === ContentSubmissionStatus.REJECTED ||
        dto.status === ContentSubmissionStatus.CHANGE_REQUESTED) &&
      !reviewComment
    ) {
      throw new BadRequestError(
        "reviewComment is required for reject and request changes actions.",
        "CONTENT_SUBMISSION_REVIEW_COMMENT_REQUIRED",
      );
    }

    const updatedSubmission = await this.contentSubmissionRepository.updateReview(
      id,
      {
        status: dto.status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.id,
        reviewComment,
      },
    );

    if (!updatedSubmission) {
      throw new NotFoundError(
        "Content submission not found.",
        "CONTENT_SUBMISSION_NOT_FOUND",
      );
    }

    const creatorProfile = await this.creatorProfileRepository.findById(
      submission.creatorProfileId,
    );
    if (creatorProfile) {
      const creatorUser = await this.userRepository.findById(creatorProfile.userId);
      if (creatorUser) {
        await this.notificationService.notifyUser(
          creatorUser.id,
          `Content submission ${dto.status.toLowerCase().replaceAll("_", " ")}`,
          reviewComment
            ? `Your content submission was updated: ${reviewComment}`
            : `Your content submission status is now ${dto.status.replaceAll("_", " ")}.`,
          NotificationType.CAMPAIGN,
          {
            entityType: "content_submission",
            entityId: submission.id,
          },
        );
      }
    }

    return this.contentSubmissionRepository.findDetailedById(id);
  }
}
