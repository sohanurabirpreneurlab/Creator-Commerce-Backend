import { CampaignCreatorStatus } from "../constants/campaign.constants.js";
import { UserRole } from "../constants/roles.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { UpdateCampaignCreatorStatusDto } from "../interfaces/campaign-creator.interface.js";
import { BrandManagerService } from "./brand-manager.service.js";
import { CampaignCreatorRepository } from "../repositories/campaign-creator.repository.js";
import { CreatorProfileRepository } from "../repositories/creator-profile.repository.js";
import { validateEnumValue } from "../utils/validation.js";
import { CAMPAIGN_CREATOR_STATUSES } from "../constants/campaign.constants.js";
import { CampaignRepository } from "../repositories/campaign.repository.js";

export class CampaignCreatorService {
  constructor(
    private readonly campaignCreatorRepository: CampaignCreatorRepository,
    private readonly creatorProfileRepository: CreatorProfileRepository,
    private readonly campaignRepository: CampaignRepository,
    private readonly brandManagerService: BrandManagerService,
  ) {}

  public async createApprovedCreator(
    campaignId: string,
    creatorProfileId: string,
    applicationId: string | null,
    approvedBy: string,
  ) {
    const existingCreator = await this.campaignCreatorRepository.findByCampaignAndCreator(
      campaignId,
      creatorProfileId,
    );

    // Approval is idempotent here. If the row already exists we return it so
    // application approval can safely be retried without duplicate data.
    if (existingCreator) {
      return existingCreator;
    }

    return this.campaignCreatorRepository.create({
      campaignId,
      creatorProfileId,
      campaignApplicationId: applicationId,
      status: CampaignCreatorStatus.APPROVED,
      approvedBy,
    });
  }

  public async getCampaignCreators(campaignId: string, currentUser: CurrentUser) {
    const campaign = await this.campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new NotFoundError("Campaign not found.", "CAMPAIGN_NOT_FOUND");
    }

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      const assignment = await this.brandManagerService.getMyBrandManagerProfile(
        currentUser,
      );

      if (assignment.brandId !== campaign.brandId) {
        throw new ForbiddenError(
          "Brand managers can only access creators for their own brand campaigns.",
          "CAMPAIGN_CREATOR_ACCESS_FORBIDDEN",
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "You do not have access to campaign creators.",
        "CAMPAIGN_CREATOR_ACCESS_FORBIDDEN",
      );
    }

    return this.campaignCreatorRepository.findManyByCampaignId(campaignId, {
      page: 1,
      limit: 100,
    });
  }

  public async getMyCampaigns(currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can view their own campaign assignments.",
        "CAMPAIGN_CREATOR_ACCESS_FORBIDDEN",
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

    const result = await this.campaignCreatorRepository.findManyByCreatorProfileId(
      creatorProfile.id,
      {
        page: 1,
        limit: 100,
      },
    );

    return result.data;
  }

  public async updateCampaignCreatorStatus(
    id: string,
    dto: UpdateCampaignCreatorStatusDto,
    currentUser: CurrentUser,
  ) {
    const campaignCreator = await this.campaignCreatorRepository.findById(id);
    if (!campaignCreator) {
      throw new NotFoundError(
        "Campaign creator not found.",
        "CAMPAIGN_CREATOR_NOT_FOUND",
      );
    }

    const campaign = await this.campaignRepository.findById(campaignCreator.campaignId);
    if (!campaign) {
      throw new NotFoundError("Campaign not found.", "CAMPAIGN_NOT_FOUND");
    }

    if (currentUser.role === UserRole.BRAND_MANAGER) {
      const assignment = await this.brandManagerService.getMyBrandManagerProfile(
        currentUser,
      );

      if (assignment.brandId !== campaign.brandId) {
        throw new ForbiddenError(
          "Brand managers can only update creators for their own campaigns.",
          "CAMPAIGN_CREATOR_ACCESS_FORBIDDEN",
        );
      }
    } else if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "You do not have access to update campaign creators.",
        "CAMPAIGN_CREATOR_ACCESS_FORBIDDEN",
      );
    }

    const status = validateEnumValue(dto.status, CAMPAIGN_CREATOR_STATUSES, "status");
    const updatedCreator = await this.campaignCreatorRepository.updateStatus(
      id,
      status,
      {
        removedAt: status === CampaignCreatorStatus.REMOVED ? new Date().toISOString() : null,
      },
    );

    if (!updatedCreator) {
      throw new NotFoundError(
        "Campaign creator not found.",
        "CAMPAIGN_CREATOR_NOT_FOUND",
      );
    }

    return updatedCreator;
  }
}
