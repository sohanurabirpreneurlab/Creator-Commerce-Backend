import { Router } from "express";
import { BrandController } from "../controllers/brand.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { UserRole } from "../constants/roles.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createAdminBrandRoutes(brandController: BrandController) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));
  router.post("/", asyncHandler(brandController.createBrand));
  router.get("/", asyncHandler(brandController.getBrands));
  router.get("/:id", asyncHandler(brandController.getBrandById));
  router.patch("/:id", asyncHandler(brandController.updateBrand));
  router.patch("/:id/status", asyncHandler(brandController.updateBrandStatus));

  return router;
}
