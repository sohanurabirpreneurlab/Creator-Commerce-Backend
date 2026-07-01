import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { AuthController } from "./controllers/auth.controller.js";
import { AnalyticsController } from "./controllers/analytics.controller.js";
import { BrandAmbassadorController } from "./controllers/brand-ambassador.controller.js";
import { BrandController } from "./controllers/brand.controller.js";
import { BrandManagerController } from "./controllers/brand-manager.controller.js";
import { CampaignApplicationController } from "./controllers/campaign-application.controller.js";
import { CampaignController } from "./controllers/campaign.controller.js";
import { ContentSubmissionController } from "./controllers/content-submission.controller.js";
import { CreatorProfileController } from "./controllers/creator-profile.controller.js";
import { CreatorPerformanceController } from "./controllers/creator-performance.controller.js";
import { CreatorSocialAccountController } from "./controllers/creator-social-account.controller.js";
import { NotificationController } from "./controllers/notification.controller.js";
import { NotificationPreferenceController } from "./controllers/notification-preference.controller.js";
import { ProfileController } from "./controllers/profile.controller.js";
import { SuperAdminController } from "./controllers/super-admin.controller.js";
import { TrackingLinkController } from "./controllers/tracking-link.controller.js";
import { AnalyticsRepository } from "./repositories/analytics.repository.js";
import { databasePool } from "./lib/database.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { AuthRepository } from "./repositories/auth.repository.js";
import { AuditLogRepository } from "./repositories/audit-log.repository.js";
import { BrandAmbassadorRepository } from "./repositories/brand-ambassador.repository.js";
import { BrandManagerRepository } from "./repositories/brand-manager.repository.js";
import { BrandRepository } from "./repositories/brand.repository.js";
import { CampaignApplicationRepository } from "./repositories/campaign-application.repository.js";
import { CampaignCreatorRepository } from "./repositories/campaign-creator.repository.js";
import { CampaignRepository } from "./repositories/campaign.repository.js";
import { ContentSubmissionRepository } from "./repositories/content-submission.repository.js";
import { CreatorProfileRepository } from "./repositories/creator-profile.repository.js";
import { CreatorSocialAccountRepository } from "./repositories/creator-social-account.repository.js";
import { NotificationPreferenceRepository } from "./repositories/notification-preference.repository.js";
import { NotificationRepository } from "./repositories/notification.repository.js";
import { TrackingLinkRepository } from "./repositories/tracking-link.repository.js";
import { UserRepository } from "./repositories/user.repository.js";
import { createApiRouter } from "./routes/index.js";
import { AuthService } from "./services/auth.service.js";
import { AnalyticsService } from "./services/analytics.service.js";
import { BrandAmbassadorService } from "./services/brand-ambassador.service.js";
import { BrandManagerService } from "./services/brand-manager.service.js";
import { BrandService } from "./services/brand.service.js";
import { CampaignApplicationService } from "./services/campaign-application.service.js";
import { CampaignCreatorService } from "./services/campaign-creator.service.js";
import { CampaignService } from "./services/campaign.service.js";
import { ContentSubmissionService } from "./services/content-submission.service.js";
import { CreatorProfileService } from "./services/creator-profile.service.js";
import { CreatorPerformanceService } from "./services/creator-performance.service.js";
import { CreatorSocialAccountService } from "./services/creator-social-account.service.js";
import { NotificationPreferenceService } from "./services/notification-preference.service.js";
import { NotificationService } from "./services/notification.service.js";
import { ProfileService } from "./services/profile.service.js";
import { ProfileCompletionService } from "./services/profile-completion.service.js";
import { SuperAdminService } from "./services/super-admin.service.js";
import { TrackingLinkService } from "./services/tracking-link.service.js";
import { UserService } from "./services/user.service.js";

export function createApp() {
  const app = express();

  const authRepository = new AuthRepository(databasePool);
  const analyticsRepository = new AnalyticsRepository(databasePool);
  const brandAmbassadorRepository = new BrandAmbassadorRepository(databasePool);
  const brandRepository = new BrandRepository(databasePool);
  const brandManagerRepository = new BrandManagerRepository(databasePool);
  const creatorProfileRepository = new CreatorProfileRepository(databasePool);
  const creatorSocialAccountRepository = new CreatorSocialAccountRepository(
    databasePool,
  );
  const campaignRepository = new CampaignRepository(databasePool);
  const contentSubmissionRepository = new ContentSubmissionRepository(databasePool);
  const campaignApplicationRepository = new CampaignApplicationRepository(
    databasePool,
  );
  const campaignCreatorRepository = new CampaignCreatorRepository(databasePool);
  const trackingLinkRepository = new TrackingLinkRepository(databasePool);
  const notificationRepository = new NotificationRepository(databasePool);
  const notificationPreferenceRepository = new NotificationPreferenceRepository(
    databasePool,
  );
  const userRepository = new UserRepository(databasePool);
  const auditLogRepository = new AuditLogRepository(databasePool);

  const authService = new AuthService(authRepository);
  const userService = new UserService(userRepository, auditLogRepository);
  const profileCompletionService = new ProfileCompletionService();
  const notificationService = new NotificationService(notificationRepository);
  const notificationPreferenceService = new NotificationPreferenceService(
    notificationPreferenceRepository,
  );
  const brandService = new BrandService(
    brandRepository,
    brandManagerRepository,
    authRepository,
  );
  const brandManagerService = new BrandManagerService(
    brandManagerRepository,
    brandRepository,
    authRepository,
  );
  const analyticsService = new AnalyticsService(
    analyticsRepository,
    brandManagerService,
  );
  const creatorProfileService = new CreatorProfileService(
    creatorProfileRepository,
  );
  const creatorSocialAccountService = new CreatorSocialAccountService(
    creatorSocialAccountRepository,
    creatorProfileRepository,
  );
  const contentSubmissionService = new ContentSubmissionService(
    contentSubmissionRepository,
    creatorProfileRepository,
    brandManagerService,
    notificationService,
    userRepository,
  );
  const brandAmbassadorService = new BrandAmbassadorService(
    brandAmbassadorRepository,
    creatorProfileRepository,
    brandManagerService,
    userRepository,
  );
  const campaignCreatorService = new CampaignCreatorService(
    campaignCreatorRepository,
    creatorProfileRepository,
    campaignRepository,
    brandManagerService,
  );
  const campaignService = new CampaignService(
    campaignRepository,
    brandManagerService,
    creatorProfileRepository,
  );
  const campaignApplicationService = new CampaignApplicationService(
    campaignApplicationRepository,
    creatorProfileRepository,
    campaignService,
    campaignCreatorService,
    notificationService,
    brandManagerService,
    userRepository,
  );
  const trackingLinkService = new TrackingLinkService(
    trackingLinkRepository,
    campaignRepository,
    campaignCreatorRepository,
    creatorProfileRepository,
    brandManagerService,
    notificationService,
  );
  const creatorPerformanceService = new CreatorPerformanceService(
    creatorProfileRepository,
    campaignApplicationRepository,
    trackingLinkRepository,
  );
  const profileService = new ProfileService(
    creatorProfileService,
    creatorSocialAccountService,
    brandService,
    brandManagerService,
    userService,
    profileCompletionService,
  );
  const superAdminService = new SuperAdminService(
    userService,
    userRepository,
    brandRepository,
    brandManagerRepository,
    creatorProfileRepository,
  );

  const authController = new AuthController(authService);
  const analyticsController = new AnalyticsController(analyticsService);
  const brandAmbassadorController = new BrandAmbassadorController(
    brandAmbassadorService,
  );
  const profileController = new ProfileController(profileService);
  const brandController = new BrandController(brandService);
  const brandManagerController = new BrandManagerController(brandManagerService);
  const campaignController = new CampaignController(campaignService);
  const campaignApplicationController = new CampaignApplicationController(
    campaignApplicationService,
  );
  const contentSubmissionController = new ContentSubmissionController(
    contentSubmissionService,
  );
  const creatorProfileController = new CreatorProfileController(
    creatorProfileService,
  );
  const creatorPerformanceController = new CreatorPerformanceController(
    creatorPerformanceService,
  );
  const creatorSocialAccountController = new CreatorSocialAccountController(
    creatorSocialAccountService,
  );
  const trackingLinkController = new TrackingLinkController(trackingLinkService);
  const notificationController = new NotificationController(notificationService);
  const notificationPreferenceController = new NotificationPreferenceController(
    notificationPreferenceService,
  );
  const superAdminController = new SuperAdminController(superAdminService);

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.json({
      success: true,
      message: "Creators Lab backend is running.",
      data: null,
    });
  });

  app.use(
    "/api",
    createApiRouter(
      authController,
      analyticsController,
      brandAmbassadorController,
      profileController,
      brandController,
      brandManagerController,
      campaignController,
      campaignApplicationController,
      contentSubmissionController,
      creatorProfileController,
      creatorPerformanceController,
      creatorSocialAccountController,
      trackingLinkController,
      notificationController,
      notificationPreferenceController,
      superAdminController,
    ),
  );
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
