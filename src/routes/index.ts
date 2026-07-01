import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { AnalyticsController } from "../controllers/analytics.controller.js";
import { BrandAmbassadorController } from "../controllers/brand-ambassador.controller.js";
import { BrandController } from "../controllers/brand.controller.js";
import { BrandManagerController } from "../controllers/brand-manager.controller.js";
import { CampaignApplicationController } from "../controllers/campaign-application.controller.js";
import { CampaignController } from "../controllers/campaign.controller.js";
import { ContentSubmissionController } from "../controllers/content-submission.controller.js";
import { CreatorProfileController } from "../controllers/creator-profile.controller.js";
import { CreatorPerformanceController } from "../controllers/creator-performance.controller.js";
import { CreatorSocialAccountController } from "../controllers/creator-social-account.controller.js";
import { NotificationController } from "../controllers/notification.controller.js";
import { NotificationPreferenceController } from "../controllers/notification-preference.controller.js";
import { ProfileController } from "../controllers/profile.controller.js";
import { SuperAdminController } from "../controllers/super-admin.controller.js";
import { TrackingLinkController } from "../controllers/tracking-link.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { createRbacTestRoutes } from "./rbac-test.routes.js";
import { asyncHandler } from "../utils/async-handler.js";
import { createAdminCampaignRoutes } from "./admin-campaign.routes.js";
import { createAdminAnalyticsRoutes } from "./admin-analytics.routes.js";
import { createAdminBrandAmbassadorRoutes } from "./admin-brand-ambassador.routes.js";
import { createAuthRoutes } from "./auth.routes.js";
import { createAdminBrandRoutes } from "./admin-brand.routes.js";
import { createAdminContentSubmissionRoutes } from "./admin-content-submission.routes.js";
import { createAdminCreatorApplicationRoutes } from "./admin-creator-application.routes.js";
import { createAdminTrackingRoutes } from "./admin-tracking.routes.js";
import { createBrandAmbassadorRoutes } from "./brand-ambassador.routes.js";
import { createBrandApplicationRoutes } from "./brand-application.routes.js";
import { createBrandAnalyticsRoutes } from "./brand-analytics.routes.js";
import { createBrandContentSubmissionRoutes } from "./brand-content-submission.routes.js";
import { createBrandRoutes } from "./brand.routes.js";
import { createBrandCampaignRoutes } from "./brand-campaign.routes.js";
import { createBrandTrackingRoutes } from "./brand-tracking.routes.js";
import { createAdminBrandManagerRoutes } from "./admin-brand-manager.routes.js";
import { createBrandManagerRoutes } from "./brand-manager.routes.js";
import { createCreatorApplicationRoutes } from "./creator-application.routes.js";
import { createCreatorCampaignRoutes } from "./creator-campaign.routes.js";
import { createCreatorContentRoutes } from "./creator-content.routes.js";
import { createCreatorPerformanceRoutes } from "./creator-performance.routes.js";
import { createCreatorProfileRoutes } from "./creator-profile.routes.js";
import { createCreatorSocialAccountRoutes } from "./creator-social-account.routes.js";
import { createCreatorTrackingRoutes } from "./creator-tracking.routes.js";
import { createAdminCreatorRoutes } from "./admin-creator.routes.js";
import { createNotificationPreferenceRoutes } from "./notification-preference.routes.js";
import { createNotificationRoutes } from "./notification.routes.js";
import { createProfileRoutes } from "./profile.routes.js";
import { createSuperAdminRoutes } from "./super-admin.routes.js";

export function createApiRouter(
  authController: AuthController,
  analyticsController: AnalyticsController,
  brandAmbassadorController: BrandAmbassadorController,
  profileController: ProfileController,
  brandController: BrandController,
  brandManagerController: BrandManagerController,
  campaignController: CampaignController,
  campaignApplicationController: CampaignApplicationController,
  contentSubmissionController: ContentSubmissionController,
  creatorProfileController: CreatorProfileController,
  creatorPerformanceController: CreatorPerformanceController,
  creatorSocialAccountController: CreatorSocialAccountController,
  trackingLinkController: TrackingLinkController,
  notificationController: NotificationController,
  notificationPreferenceController: NotificationPreferenceController,
  superAdminController: SuperAdminController,
) {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({
      success: true,
      message: "API is healthy.",
      data: {
        service: "creator-commerce-backend",
      },
    });
  });

  router.use("/auth", createAuthRoutes(authController));
  router.get("/me", requireAuth, asyncHandler(authController.getCurrentUser));
  router.use("/rbac-test", createRbacTestRoutes());
  router.use("/notifications", createNotificationRoutes(notificationController));
  router.use(
    "/notification-preferences",
    createNotificationPreferenceRoutes(notificationPreferenceController),
  );
  router.use("/profile", createProfileRoutes(profileController));
  router.use("/admin", createSuperAdminRoutes(superAdminController));
  router.use("/admin/analytics", createAdminAnalyticsRoutes(analyticsController));
  router.use(
    "/admin/brand-ambassadors",
    createAdminBrandAmbassadorRoutes(brandAmbassadorController),
  );
  router.use("/admin/campaigns", createAdminCampaignRoutes(campaignController));
  router.use("/admin/tracking-links", createAdminTrackingRoutes(trackingLinkController));
  router.use("/admin/brands", createAdminBrandRoutes(brandController));
  router.use(
    "/admin/content-submissions",
    createAdminContentSubmissionRoutes(contentSubmissionController),
  );
  router.use(
    "/admin/creator-applications",
    createAdminCreatorApplicationRoutes(campaignApplicationController),
  );
  router.use(
    "/admin/brand-managers",
    createAdminBrandManagerRoutes(brandManagerController),
  );
  router.use(
    "/admin/creators",
    createAdminCreatorRoutes(
      creatorProfileController,
      creatorSocialAccountController,
    ),
  );
  router.use("/brand/campaigns", createBrandCampaignRoutes(campaignController));
  router.use("/brand/ambassadors", createBrandAmbassadorRoutes(brandAmbassadorController));
  router.use("/brand/analytics", createBrandAnalyticsRoutes(analyticsController));
  router.use(
    "/brand/creator-applications",
    createBrandApplicationRoutes(campaignApplicationController),
  );
  router.use(
    "/brand/content-submissions",
    createBrandContentSubmissionRoutes(contentSubmissionController),
  );
  router.use("/brand/tracking-links", createBrandTrackingRoutes(trackingLinkController));
  router.use("/brand", createBrandRoutes(brandController));
  router.use("/brand-manager", createBrandManagerRoutes(brandManagerController));
  router.use("/creator/campaigns", createCreatorCampaignRoutes(campaignController));
  router.use("/creator", createCreatorApplicationRoutes(campaignApplicationController));
  router.use("/creator/content-submissions", createCreatorContentRoutes(contentSubmissionController));
  router.use("/creator/performance", createCreatorPerformanceRoutes(creatorPerformanceController));
  router.use("/creator", createCreatorProfileRoutes(creatorProfileController));
  router.use("/creator/tracking-links", createCreatorTrackingRoutes(trackingLinkController));
  router.use(
    "/creator/social-accounts",
    createCreatorSocialAccountRoutes(creatorSocialAccountController),
  );

  return router;
}
