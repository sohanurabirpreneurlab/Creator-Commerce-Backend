import { UserRole } from "../constants/roles.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import {
  AdminAnalyticsResponse,
  BrandAnalyticsResponse,
} from "../interfaces/analytics.interface.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { AnalyticsRepository } from "../repositories/analytics.repository.js";
import { BrandManagerService } from "./brand-manager.service.js";

const ANALYTICS_NOTE =
  "Advanced click/conversion analytics will be added after tracking and conversion modules.";

export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly brandManagerService: BrandManagerService,
  ) {}

  public async getBrandAnalytics(
    currentUser: CurrentUser,
  ): Promise<BrandAnalyticsResponse> {
    if (currentUser.role !== UserRole.BRAND_MANAGER) {
      throw new ForbiddenError(
        "Only brand managers can access brand analytics.",
        "ANALYTICS_FORBIDDEN",
      );
    }

    const assignment = await this.brandManagerService.getMyBrandManagerProfile(
      currentUser,
    );

    const [summary, campaignStatusBreakdown, applicationStatusBreakdown] =
      await Promise.all([
        this.analyticsRepository.getBrandSummary(assignment.brandId),
        this.analyticsRepository.getCampaignStatusBreakdownByBrand(
          assignment.brandId,
        ),
        this.analyticsRepository.getApplicationStatusBreakdownByBrand(
          assignment.brandId,
        ),
      ]);

    return {
      summary,
      campaignStatusBreakdown,
      applicationStatusBreakdown,
      note: ANALYTICS_NOTE,
    };
  }

  public async getAdminAnalytics(
    currentUser: CurrentUser,
  ): Promise<AdminAnalyticsResponse> {
    if (currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenError(
        "Only super admins can access platform analytics.",
        "ANALYTICS_FORBIDDEN",
      );
    }

    const [summary, campaignStatusBreakdown, applicationStatusBreakdown] =
      await Promise.all([
        this.analyticsRepository.getPlatformSummary(),
        this.analyticsRepository.getCampaignStatusBreakdown(),
        this.analyticsRepository.getApplicationStatusBreakdown(),
      ]);

    return {
      summary,
      campaignStatusBreakdown,
      applicationStatusBreakdown,
      note: ANALYTICS_NOTE,
    };
  }
}
