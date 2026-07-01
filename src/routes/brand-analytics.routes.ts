import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { AnalyticsController } from "../controllers/analytics.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createBrandAnalyticsRoutes(
  analyticsController: AnalyticsController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.BRAND_MANAGER));
  router.get("/", asyncHandler(analyticsController.getBrandAnalytics));

  return router;
}
