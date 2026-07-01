import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { CampaignController } from "../controllers/campaign.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createAdminCampaignRoutes(campaignController: CampaignController) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));
  router.get("/", asyncHandler(campaignController.getAdminCampaigns));
  router.get("/:id", asyncHandler(campaignController.getCampaignById));
  router.patch("/:id/status", asyncHandler(campaignController.updateCampaignStatus));

  return router;
}
