import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { BrandAmbassadorController } from "../controllers/brand-ambassador.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createAdminBrandAmbassadorRoutes(
  brandAmbassadorController: BrandAmbassadorController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));
  router.get("/", asyncHandler(brandAmbassadorController.getBrandAmbassadors));
  router.get("/:id", asyncHandler(brandAmbassadorController.getBrandAmbassadorById));
  router.patch(
    "/:id/status",
    asyncHandler(brandAmbassadorController.updateBrandAmbassadorStatus),
  );

  return router;
}
