import {
  TRACKING_LINK_STATUSES,
  CampaignCreatorStatus,
  TrackingLinkStatus,
} from "../constants/campaign.constants.js";
import { env } from "../config/env.js";
import { NotificationType } from "../constants/notification.constants.js";
import { UserRole } from "../constants/roles.js";
import { ConflictError } from "../errors/conflict-error.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import {
  CreateTrackingLinkDto,
  TrackingLinkQueryDto,
} from "../interfaces/tracking-link.interface.js";
import { CampaignCreatorRepository } from "../repositories/campaign-creator.repository.js";
import { CampaignRepository } from "../repositories/campaign.repository.js";
import { CreatorProfileRepository } from "../repositories/creator-profile.repository.js";
import { TrackingLinkRepository } from "../repositories/tracking-link.repository.js";
import { BrandManagerService } from "./brand-manager.service.js";
import { NotificationService } from "./notification.service.js";
import { createPaginationMeta, parsePaginationQuery } from "../utils/pagination.js";
import {
  generateShortCode,
} from "../utils/short-code-generator.js";
import {
  normalizeOptionalString,
  validateEnumValue,
  validateOptionalUrl,
} from "../utils/validation.js";

export class TrackingLinkService {
  constructor(
    private readonly trackingLinkRepository: TrackingLinkRepository,
    private readonly campaignRepository: CampaignRepository,
    private readonly campaignCreatorRepository: CampaignCreatorRepository,
    private readonly creatorProfileRepository: CreatorProfileRepository,
    private readonly brandManagerService: BrandManagerService,
    private readonly notificationService: NotificationService,
  ) {}

  public async createTrackingLink(
    dto: CreateTrackingLinkDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can create tracking links.",
        "TRACKING_LINK_FORBIDDEN",
      );
    }

    const assignment = await this.brandManagerService.getMyBrandManagerProfile(
      currentUser,
    );
    const campaign = await this.campaignRepository.findById(dto.campaignId);

    if (!campaign) {
      throw new NotFoundError("Campaign not found.", "CAMPAIGN_NOT_FOUND");
    }

    if (campaign.brandId !== assignment.brandId) {
      throw new ForbiddenError(
        "Brand managers can only create tracking links for their own brand campaigns.",
        "TRACKING_LINK_FORBIDDEN",
      );
    }

    const creatorProfile = await this.creatorProfileRepository.findById(
      dto.creatorProfileId,
    );
    if (!creatorProfile) {
      throw new NotFoundError(
        "Creator profile not found. Please complete your creator profile first.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    const campaignCreator =
      await this.campaignCreatorRepository.findByCampaignAndCreator(
        dto.campaignId,
        dto.creatorProfileId,
      );

    if (!campaignCreator) {
      throw new NotFoundError(
        "Approved campaign creator relationship not found.",
        "CAMPAIGN_CREATOR_NOT_FOUND",
      );
    }

    if (
      ![
        CampaignCreatorStatus.APPROVED,
        CampaignCreatorStatus.ACTIVE,
      ].includes(campaignCreator.status)
    ) {
      throw new ForbiddenError(
        "Tracking links can only be created for approved or active campaign creators.",
        "TRACKING_LINK_FORBIDDEN",
      );
    }

    const existingTrackingLink = await this.trackingLinkRepository.findByCampaignAndCreator(
      dto.campaignId,
      dto.creatorProfileId,
    );

    if (existingTrackingLink) {
      throw new ConflictError(
        "A tracking link already exists for this campaign and creator.",
        "TRACKING_LINK_ALREADY_EXISTS",
      );
    }

    const destinationUrl =
      validateOptionalUrl(
        normalizeOptionalString(dto.destinationUrl) ?? campaign.destinationUrl,
        "destinationUrl",
      ) ?? campaign.destinationUrl;

    if (!destinationUrl) {
      throw new NotFoundError(
        "No destination URL is available for this tracking link.",
        "TRACKING_LINK_DESTINATION_URL_MISSING",
      );
    }

    const shortCode = await this.generateUniqueShortCode(dto.shortCode);
    const trackingLink = await this.trackingLinkRepository.create({
      campaignId: dto.campaignId,
      creatorProfileId: dto.creatorProfileId,
      campaignCreatorId: campaignCreator.id,
      brandId: campaign.brandId,
      shortCode,
      destinationUrl,
      status: TrackingLinkStatus.ACTIVE,
      generatedBy: currentUser.id,
    });

    await this.notificationService.notifyUser(
      creatorProfile.userId,
      "Tracking link created",
      "A new tracking link has been created for your campaign participation.",
      NotificationType.TRACKING_LINK,
      {
        entityType: "tracking_link",
        entityId: trackingLink.id,
      },
    );

    return trackingLink;
  }

  public async getTrackingLinkById(id: string, currentUser: CurrentUser) {
    const trackingLink = await this.trackingLinkRepository.findById(id);
    if (!trackingLink) {
      throw new NotFoundError(
        "Tracking link not found.",
        "TRACKING_LINK_NOT_FOUND",
      );
    }

    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return trackingLink;
    }

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      const assignment = await this.brandManagerService.getMyBrandManagerProfile(
        currentUser,
      );

      if (assignment.brandId !== trackingLink.brandId) {
        throw new ForbiddenError(
          "Brand managers can only access their own brand tracking links.",
          "TRACKING_LINK_FORBIDDEN",
        );
      }

      return trackingLink;
    }

    const creatorProfile = await this.creatorProfileRepository.findByUserId(
      currentUser.id,
    );
    if (!creatorProfile || creatorProfile.id !== trackingLink.creatorProfileId) {
      throw new ForbiddenError(
        "Creators can only access their own tracking links.",
        "TRACKING_LINK_FORBIDDEN",
      );
    }

    return trackingLink;
  }

  public async getMyTrackingLinks(
    query: TrackingLinkQueryDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can view their tracking links.",
        "TRACKING_LINK_FORBIDDEN",
      );
    }

    const creatorProfile = await this.creatorProfileRepository.findByUserId(
      currentUser.id,
    );
    if (!creatorProfile) {
      throw new NotFoundError(
        "Creator profile not found.",
        "CREATOR_PROFILE_NOT_FOUND",
      );
    }

    const filters = this.buildFilters(query);
    const result = await this.trackingLinkRepository.findManyByCreatorProfileId(
      creatorProfile.id,
      filters,
    );

    return {
      data: result.data.map((trackingLink) => ({
        ...trackingLink,
        trackingUrl: this.buildTrackingUrl(trackingLink.shortCode),
      })),
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async getBrandTrackingLinks(
    query: TrackingLinkQueryDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can view brand tracking links.",
        "TRACKING_LINK_FORBIDDEN",
      );
    }

    const assignment = await this.brandManagerService.getMyBrandManagerProfile(
      currentUser,
    );
    const filters = this.buildFilters(query);
    const result = await this.trackingLinkRepository.findManyByBrandId(
      assignment.brandId,
      filters,
    );

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async getAdminTrackingLinks(
    query: TrackingLinkQueryDto,
    currentUser: CurrentUser,
  ) {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can view all tracking links.",
        "TRACKING_LINK_FORBIDDEN",
      );
    }

    const filters = this.buildFilters(query);
    const result = await this.trackingLinkRepository.findMany(filters);

    return {
      data: result.data,
      meta: createPaginationMeta(filters.page, filters.limit, result.total),
    };
  }

  public async deactivateTrackingLink(id: string, currentUser: CurrentUser) {
    const trackingLink = await this.getTrackingLinkById(id, currentUser);

    if (
      currentUser.role !== UserRole.BRAND_MANAGER &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenError(
        "You do not have access to deactivate tracking links.",
        "TRACKING_LINK_FORBIDDEN",
      );
    }

    const updatedTrackingLink = await this.trackingLinkRepository.updateStatus(
      trackingLink.id,
      TrackingLinkStatus.DEACTIVATED,
    );

    if (!updatedTrackingLink) {
      throw new NotFoundError(
        "Tracking link not found.",
        "TRACKING_LINK_NOT_FOUND",
      );
    }

    return updatedTrackingLink;
  }

  private buildFilters(query: TrackingLinkQueryDto) {
    const pagination = parsePaginationQuery(query);

    return {
      page: pagination.page,
      limit: pagination.limit,
      search: query.search?.trim() || undefined,
      status:
        query.status === undefined
          ? undefined
          : validateEnumValue(query.status, TRACKING_LINK_STATUSES, "status"),
    };
  }

  private buildTrackingUrl(shortCode: string) {
    const baseUrl = env.trackingBaseUrl ?? "https://go.creatorcommerce.test";
    return `${baseUrl.replace(/\/+$/, "")}/${shortCode}`;
  }

  private async generateUniqueShortCode(shortCode?: string) {
    const preferredShortCode = normalizeOptionalString(shortCode);

    if (preferredShortCode) {
      const existingTrackingLink = await this.trackingLinkRepository.findByShortCode(
        preferredShortCode,
      );

      if (existingTrackingLink) {
        throw new ConflictError(
          "shortCode is already in use.",
          "TRACKING_LINK_SHORT_CODE_EXISTS",
        );
      }

      return preferredShortCode;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const generatedShortCode = generateShortCode();
      const existingTrackingLink = await this.trackingLinkRepository.findByShortCode(
        generatedShortCode,
      );

      if (!existingTrackingLink) {
        return generatedShortCode;
      }
    }

    throw new ConflictError(
      "Unable to generate a unique short code.",
      "TRACKING_LINK_SHORT_CODE_GENERATION_FAILED",
    );
  }
}
