import { Router } from "express";
import { BrandManagerController } from "../controllers/brand-manager.controller.js";
import { UserRole } from "../constants/roles.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createAdminBrandManagerRoutes(
  brandManagerController: BrandManagerController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));
  router.post("/", asyncHandler(brandManagerController.assignBrandManager));
  router.get("/", asyncHandler(brandManagerController.getBrandManagers));
  router.get(
    "/brands/:brandId",
    asyncHandler(brandManagerController.getBrandManagersByBrand),
  );
  router.get("/:id", asyncHandler(brandManagerController.getBrandManagerById));
  router.patch("/:id", asyncHandler(brandManagerController.updateBrandManager));
  router.delete("/:id", asyncHandler(brandManagerController.removeBrandManager));

  return router;
}
