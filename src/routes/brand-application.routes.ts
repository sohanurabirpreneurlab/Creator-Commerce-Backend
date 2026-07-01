import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { CampaignApplicationController } from "../controllers/campaign-application.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createBrandApplicationRoutes(
  campaignApplicationController: CampaignApplicationController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.BRAND_MANAGER));
  router.get("/", asyncHandler(campaignApplicationController.getBrandApplications));
  router.get("/:id", asyncHandler(campaignApplicationController.getApplicationById));
  router.patch("/:id/approve", asyncHandler(campaignApplicationController.approveApplication));
  router.patch("/:id/reject", asyncHandler(campaignApplicationController.rejectApplication));

  return router;
}
