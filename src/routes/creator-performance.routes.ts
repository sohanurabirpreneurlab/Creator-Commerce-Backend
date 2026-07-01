import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { CreatorPerformanceController } from "../controllers/creator-performance.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createCreatorPerformanceRoutes(
  creatorPerformanceController: CreatorPerformanceController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.CREATOR));
  router.get("/", asyncHandler(creatorPerformanceController.getMyPerformance));

  return router;
}
