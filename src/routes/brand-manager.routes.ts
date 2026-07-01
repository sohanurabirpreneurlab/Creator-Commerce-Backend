import { Router } from "express";
import { BrandManagerController } from "../controllers/brand-manager.controller.js";
import { UserRole } from "../constants/roles.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createBrandManagerRoutes(
  brandManagerController: BrandManagerController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.BRAND_MANAGER));
  router.get("/me", asyncHandler(brandManagerController.getMyBrandManagerProfile));

  return router;
}
