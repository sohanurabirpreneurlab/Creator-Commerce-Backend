import { Router } from "express";
import { BrandController } from "../controllers/brand.controller.js";
import { UserRole } from "../constants/roles.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createBrandRoutes(brandController: BrandController) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.BRAND_MANAGER));
  router.get("/profile", asyncHandler(brandController.getMyBrand));
  router.patch("/profile", asyncHandler(brandController.updateMyBrand));

  return router;
}
