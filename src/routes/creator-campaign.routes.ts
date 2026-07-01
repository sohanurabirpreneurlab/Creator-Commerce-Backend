import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { CampaignController } from "../controllers/campaign.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createCreatorCampaignRoutes(campaignController: CampaignController) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.CREATOR));
  router.get("/available", asyncHandler(campaignController.getAvailableCampaignsForCreator));
  router.get("/:id", asyncHandler(campaignController.getCampaignById));

  return router;
}
