import {
  CampaignApplicationStatus,
  PROPOSED_CONTENT_TYPES,
  CampaignStatus,
} from "../constants/campaign.constants.js";
import { NotificationType } from "../constants/notification.constants.js";
import { UserRole } from "../constants/roles.js";
import { SOCIAL_PLATFORMS } from "../constants/social-platform.js";
import { BadRequestError } from "../errors/bad-request-error.js";
import { ConflictError } from "../errors/conflict-error.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  ApplyToCampaignDto,
  CampaignApplicationQueryDto,
  ReviewCampaignApplicationDto,
} from "../interfaces/campaign-application.interface.js";
import { CampaignApplicationRepository } from "../repositories/campaign-application.repository.js";
import { CreatorProfileRepository } from "../repositories/creator-profile.repository.js";
import { CampaignService } from "./campaign.service.js";
import { CampaignCreatorService } from "./campaign-creator.service.js";
import { NotificationService } from "./notification.service.js";
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination.js";
import {
  normalizeOptionalString,
  requireTrimmedString,
  validateEnumValue,
} from "../utils/validation.js";
import { CAMPAIGN_APPLICATION_STATUSES } from "../constants/campaign.constants.js";
import { BrandManagerService } from "./brand-manager.service.js";
import { UserRepository } from "../repositories/user.repository.js";

export class CampaignApplicationService {
  constructor(
    private readonly campaignApplicationRepository: CampaignApplicationRepository,
    private readonly creatorProfileRepository: CreatorProfileRepository,
    private readonly campaignService: CampaignService,
    private readonly campaignCreatorService: CampaignCreatorService,
    private readonly notificationService: NotificationService,
    private readonly brandManagerService: BrandManagerService,
    private readonly userRepository: UserRepository,
  ) {}

  public async applyToCampaign(
    campaignId: string,
    dto: ApplyToCampaignDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can apply to campaigns.",
        "CAMPAIGN_APPLICATION_FORBIDDEN",
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

    const campaign = await this.campaignService.getCampaignById(
      campaignId,
      currentUser,
    );

    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestError(
        "Applications are allowed only for active campaigns.",
        "CAMPAIGN_NOT_ACTIVE",
      );
    }

    const message = requireTrimmedString(
      dto.message,
      "message",
      "message is required.",
    );
    if (message.length < 10 || message.length > 1000) {
      throw new BadRequestError(
        "message must be between 10 and 1000 characters.",
        "CAMPAIGN_APPLICATION_INVALID_MESSAGE_LENGTH",
      );
    }

    const proposedContentType =
      dto.proposedContentType === undefined
        ? null
        : validateEnumValue(
            dto.proposedContentType,
            PROPOSED_CONTENT_TYPES,
            "proposedContentType",
          );
    const primaryPlatform =
      dto.primaryPlatform === undefined
        ? null
        : validateEnumValue(
            dto.primaryPlatform,
            SOCIAL_PLATFORMS,
            "primaryPlatform",
          );
    const expectedPostDate = this.normalizeExpectedPostDate(
      dto.expectedPostDate,
      campaign.startDate,
      campaign.endDate,
    );

    const existingApplication =
      await this.campaignApplicationRepository.findByCampaignAndCreator(
        campaignId,
        creatorProfile.id,
      );

    if (existingApplication) {
      throw new ConflictError(
        "You have already applied to this campaign.",
        "CAMPAIGN_APPLICATION_ALREADY_EXISTS",
      );
    }

    const createdApplication = await this.campaignApplicationRepository.create({
      campaignId,
      creatorProfileId: creatorProfile.id,
      status: CampaignApplicationStatus.APPLIED,
      message,
      proposedContentType,
      primaryPlatform,
      expectedPostDate,
    });

    await this.notificationService.notifyUser(
      currentUser.id,
      "Campaign application submitted",
      "Your campaign application has been submitted successfully.",
      NotificationType.APPLICATION,
      {
        entityType: "campaign_application",
        entityId: createdApplication.id,
      },
    );

    return {
      application: createdApplication,
    };
  }

  public async getMyApplications(
    query: CampaignApplicationQueryDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can view their applications.",
        "CAMPAIGN_APPLICATION_FORBIDDEN",
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
    const result =
      await this.campaignApplicationRepository.findMyApplicationsWithCampaignSummary(
        creatorProfile.id,
        filters,
      );

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async getApplicationById(id: string, currentUser: CurrentUser) {
    const application = await this.campaignApplicationRepository.findDetailedById(id);
    if (!application) {
      throw new NotFoundError(
        "Campaign application not found.",
        "CAMPAIGN_APPLICATION_NOT_FOUND",
      );
    }

    if (currentUser.role === UserRole.CREATOR) {
      const creatorProfile = await this.creatorProfileRepository.findByUserId(
        currentUser.id,
      );
      if (!creatorProfile || creatorProfile.id !== application.creatorProfileId) {
        throw new ForbiddenError(
          "You can only access your own applications.",
          "CAMPAIGN_APPLICATION_FORBIDDEN",
        );
      }

      return application;
    }

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      await this.assertBrandManagerOwnsApplication(application.campaignId, currentUser);
      return application;
    }

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return application;
    }

    throw new ForbiddenError(
      "You do not have access to this application.",
      "CAMPAIGN_APPLICATION_FORBIDDEN",
    );
  }

  public async withdrawApplication(id: string, currentUser: CurrentUser) {
    const application = await this.getApplicationById(id, currentUser);

    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can withdraw applications.",
        "CAMPAIGN_APPLICATION_FORBIDDEN",
      );
    }

    if (application.status !== CampaignApplicationStatus.APPLIED) {
      throw new BadRequestError(
        "Only applications in APPLIED status can be withdrawn.",
        "CAMPAIGN_APPLICATION_INVALID_WITHDRAWAL",
      );
    }

    const updatedApplication = await this.campaignApplicationRepository.updateStatus(
      id,
      CampaignApplicationStatus.WITHDRAWN,
    );

    if (!updatedApplication) {
      throw new NotFoundError(
        "Campaign application not found.",
        "CAMPAIGN_APPLICATION_NOT_FOUND",
      );
    }

    return updatedApplication;
  }

  public async getBrandApplications(
    query: CampaignApplicationQueryDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can view campaign applications.",
        "CAMPAIGN_APPLICATION_FORBIDDEN",
      );
    }

    const assignment = await this.brandManagerService.getMyBrandManagerProfile(
      currentUser,
    );
    const filters = this.buildFilters(query);
    const result = await this.campaignApplicationRepository.findManyByBrandId(
      assignment.brandId,
      filters,
    );

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async getAdminApplications(
    query: CampaignApplicationQueryDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can view all campaign applications.",
        "CAMPAIGN_APPLICATION_FORBIDDEN",
      );
    }

    const filters = this.buildFilters(query);
    const result = await this.campaignApplicationRepository.findMany(filters);

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async approveApplication(id: string, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can approve applications.",
        "CAMPAIGN_APPLICATION_FORBIDDEN",
      );
    }

    const application = await this.getApplicationById(id, currentUser);
    await this.assertBrandManagerOwnsApplication(application.campaignId, currentUser);

    if (application.status !== CampaignApplicationStatus.APPLIED) {
      throw new BadRequestError(
        "Only applications in APPLIED status can be approved.",
        "CAMPAIGN_APPLICATION_INVALID_APPROVAL",
      );
    }

    const updatedApplication = await this.campaignApplicationRepository.updateStatus(
      id,
      CampaignApplicationStatus.APPROVED,
      {
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.id,
        rejectionReason: null,
      },
    );

    if (!updatedApplication) {
      throw new NotFoundError(
        "Campaign application not found.",
        "CAMPAIGN_APPLICATION_NOT_FOUND",
      );
    }

    await this.campaignCreatorService.createApprovedCreator(
      updatedApplication.campaignId,
      updatedApplication.creatorProfileId,
      updatedApplication.id,
      currentUser.id,
    );

    const creatorUserId = await this.getCreatorUserId(updatedApplication.creatorProfileId);
    await this.notificationService.notifyUser(
      creatorUserId,
      "Campaign application approved",
      "Your campaign application has been approved.",
      NotificationType.APPLICATION,
      {
        entityType: "campaign_application",
        entityId: updatedApplication.id,
      },
    );

    return updatedApplication;
  }

  public async rejectApplication(
    id: string,
    dto: ReviewCampaignApplicationDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can reject applications.",
        "CAMPAIGN_APPLICATION_FORBIDDEN",
      );
    }

    const application = await this.getApplicationById(id, currentUser);
    await this.assertBrandManagerOwnsApplication(application.campaignId, currentUser);

    if (application.status !== CampaignApplicationStatus.APPLIED) {
      throw new BadRequestError(
        "Only applications in APPLIED status can be rejected.",
        "CAMPAIGN_APPLICATION_INVALID_REJECTION",
      );
    }

    const rejectionReason = normalizeOptionalString(dto.rejectionReason) ?? null;
    const updatedApplication = await this.campaignApplicationRepository.updateStatus(
      id,
      CampaignApplicationStatus.REJECTED,
      {
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.id,
        rejectionReason,
      },
    );

    if (!updatedApplication) {
      throw new NotFoundError(
        "Campaign application not found.",
        "CAMPAIGN_APPLICATION_NOT_FOUND",
      );
    }

    const creatorUserId = await this.getCreatorUserId(updatedApplication.creatorProfileId);
    await this.notificationService.notifyUser(
      creatorUserId,
      "Campaign application rejected",
      rejectionReason
        ? `Your campaign application was rejected: ${rejectionReason}`
        : "Your campaign application was rejected.",
      NotificationType.APPLICATION,
      {
        entityType: "campaign_application",
        entityId: updatedApplication.id,
      },
    );

    return updatedApplication;
  }

  private buildFilters(query: CampaignApplicationQueryDto) {
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
              CAMPAIGN_APPLICATION_STATUSES,
              "status",
            ),
    };
  }

  private async assertBrandManagerOwnsApplication(
    campaignId: string,
    currentUser: CurrentUser,
  ) {
    await this.campaignService.getCampaignById(campaignId, currentUser);
  }

  private async getCreatorUserId(creatorProfileId: string) {
    const creatorProfile = await this.creatorProfileRepository.findById(creatorProfileId);
    if (!creatorProfile) {
      throw new NotFoundError(
        "Creator profile not found.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    const user = await this.userRepository.findById(creatorProfile.userId);
    if (!user) {
      throw new NotFoundError("User not found.", "USER_NOT_FOUND");
    }

    return user.id;
  }

  private normalizeExpectedPostDate(
    value: string | undefined,
    campaignStartDate: string | null,
    campaignEndDate: string | null,
  ) {
    const normalizedValue = normalizeOptionalString(value);

    if (normalizedValue === undefined || normalizedValue === null) {
      return null;
    }

    const parsedDate = new Date(normalizedValue);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestError(
        "expectedPostDate must be a valid date.",
        "CAMPAIGN_APPLICATION_INVALID_EXPECTED_POST_DATE",
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedDate.getTime() < today.getTime()) {
      throw new BadRequestError(
        "expectedPostDate cannot be in the past.",
        "CAMPAIGN_APPLICATION_EXPECTED_POST_DATE_IN_PAST",
      );
    }

    if (campaignStartDate && parsedDate.getTime() < new Date(campaignStartDate).getTime()) {
      throw new BadRequestError(
        "expectedPostDate cannot be before the campaign start date.",
        "CAMPAIGN_APPLICATION_EXPECTED_POST_DATE_BEFORE_START",
      );
    }

    if (campaignEndDate && parsedDate.getTime() > new Date(campaignEndDate).getTime()) {
      throw new BadRequestError(
        "expectedPostDate cannot be after the campaign end date.",
        "CAMPAIGN_APPLICATION_EXPECTED_POST_DATE_AFTER_END",
      );
    }

    return parsedDate.toISOString();
  }
}
