import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { CampaignApplicationController } from "../controllers/campaign-application.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createAdminCreatorApplicationRoutes(
  campaignApplicationController: CampaignApplicationController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));
  router.get("/", asyncHandler(campaignApplicationController.getAdminApplications));
  router.get("/:id", asyncHandler(campaignApplicationController.getApplicationById));

  return router;
}
