import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { CampaignApplicationController } from "../controllers/campaign-application.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createCreatorApplicationRoutes(
  campaignApplicationController: CampaignApplicationController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.CREATOR));
  router.post(
    "/campaigns/:campaignId/apply",
    asyncHandler(campaignApplicationController.applyToCampaign),
  );
  router.get("/applications", asyncHandler(campaignApplicationController.getMyApplications));
  router.get("/applications/:id", asyncHandler(campaignApplicationController.getApplicationById));
  router.patch(
    "/applications/:id/withdraw",
    asyncHandler(campaignApplicationController.withdrawApplication),
  );

  return router;
}
