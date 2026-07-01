import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { CampaignController } from "../controllers/campaign.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createBrandCampaignRoutes(campaignController: CampaignController) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.BRAND_MANAGER));
  router.post("/", asyncHandler(campaignController.createCampaign));
  router.get("/", asyncHandler(campaignController.getBrandCampaigns));
  router.get("/:id", asyncHandler(campaignController.getCampaignById));
  router.patch("/:id", asyncHandler(campaignController.updateCampaign));
  router.patch("/:id/status", asyncHandler(campaignController.updateCampaignStatus));

  return router;
}
