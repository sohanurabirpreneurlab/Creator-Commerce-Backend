import {
  CampaignApplicationStatus,
  TrackingLinkStatus,
} from "../constants/campaign.constants.js";
import { UserRole } from "../constants/roles.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { NotFoundError } from "../errors/not-found-error.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { CreatorPerformanceResponse } from "../interfaces/performance.interface.js";
import { CampaignApplicationRepository } from "../repositories/campaign-application.repository.js";
import { CreatorProfileRepository } from "../repositories/creator-profile.repository.js";
import { TrackingLinkRepository } from "../repositories/tracking-link.repository.js";

type DemoPerformanceSeed = {
  clicks: number;
  conversions: number;
  estimatedEarnings: number;
};

const DEMO_PERFORMANCE_BY_CAMPAIGN_TITLE: Record<string, DemoPerformanceSeed> = {
  "Eid Recharge Offer": {
    clicks: 850,
    conversions: 55,
    estimatedEarnings: 11000,
  },
  "Youth Data Pack Launch": {
    clicks: 400,
    conversions: 18,
    estimatedEarnings: 3600,
  },
  "App Install Challenge": {
    clicks: 280,
    conversions: 11,
    estimatedEarnings: 2200,
  },
  "Student Lead Campaign": {
    clicks: 190,
    conversions: 7,
    estimatedEarnings: 1400,
  },
};

export class CreatorPerformanceService {
  constructor(
    private readonly creatorProfileRepository: CreatorProfileRepository,
    private readonly campaignApplicationRepository: CampaignApplicationRepository,
    private readonly trackingLinkRepository: TrackingLinkRepository,
  ) {}

  public async getMyPerformance(
    currentUser: CurrentUser,
  ): Promise<CreatorPerformanceResponse> {
    if (currentUser.role !== UserRole.CREATOR) {
      throw new ForbiddenError(
        "Only creators can view creator performance.",
        "CREATOR_PERFORMANCE_FORBIDDEN",
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

    // We intentionally build this endpoint from real campaign applications and
    // real tracking links, then layer deterministic demo metrics on top. This
    // keeps the page meaningful during development without pretending that full
    // analytics infrastructure already exists.
    const applicationResult =
      await this.campaignApplicationRepository.findMyApplicationsWithCampaignSummary(
        creatorProfile.id,
        {
          page: 1,
          limit: 100,
        },
      );
    const trackingResult = await this.trackingLinkRepository.findManyByCreatorProfileId(
      creatorProfile.id,
      {
        page: 1,
        limit: 100,
      },
    );

    const approvedApplications = applicationResult.data.filter(
      (application) => application.status === CampaignApplicationStatus.APPROVED,
    ).length;
    const activeTrackingLinks = trackingResult.data.filter(
      (trackingLink) => trackingLink.status === TrackingLinkStatus.ACTIVE,
    ).length;

    const campaignPerformance = applicationResult.data
      .filter((application) => application.status !== CampaignApplicationStatus.WITHDRAWN)
      .map((application) => {
        const demoMetrics = this.getDemoMetrics(application.campaign.title);

        return {
          campaignId: application.campaign.id,
          campaignTitle: application.campaign.title,
          brandName: application.brand.name,
          clicks: demoMetrics.clicks,
          conversions: demoMetrics.conversions,
          estimatedEarnings: demoMetrics.estimatedEarnings,
        };
      });

    const summary = campaignPerformance.reduce(
      (accumulator, campaign) => ({
        totalApplications: applicationResult.data.length,
        approvedApplications,
        activeTrackingLinks,
        estimatedClicks: accumulator.estimatedClicks + campaign.clicks,
        estimatedConversions: accumulator.estimatedConversions + campaign.conversions,
        estimatedEarnings: accumulator.estimatedEarnings + campaign.estimatedEarnings,
      }),
      {
        totalApplications: applicationResult.data.length,
        approvedApplications,
        activeTrackingLinks,
        estimatedClicks: 0,
        estimatedConversions: 0,
        estimatedEarnings: 0,
      },
    );

    return {
      summary,
      campaignPerformance,
      note: "Performance values are demo estimates until click tracking and conversion tracking are implemented.",
    };
  }

  private getDemoMetrics(campaignTitle: string): DemoPerformanceSeed {
    const explicitMetrics = DEMO_PERFORMANCE_BY_CAMPAIGN_TITLE[campaignTitle];
    if (explicitMetrics) {
      return explicitMetrics;
    }

    // This fallback keeps the endpoint deterministic for future seeded campaigns
    // without inventing randomness that would change across requests.
    const seed = campaignTitle
      .split("")
      .reduce((total, character) => total + character.charCodeAt(0), 0);

    return {
      clicks: 120 + (seed % 500),
      conversions: 8 + (seed % 30),
      estimatedEarnings: 1500 + (seed % 5000),
    };
  }
}
