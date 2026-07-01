import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { TrackingLinkController } from "../controllers/tracking-link.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createBrandTrackingRoutes(
  trackingLinkController: TrackingLinkController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.BRAND_MANAGER));
  router.post("/", asyncHandler(trackingLinkController.createTrackingLink));
  router.get("/", asyncHandler(trackingLinkController.getBrandTrackingLinks));
  router.get("/:id", asyncHandler(trackingLinkController.getTrackingLinkById));
  router.patch("/:id/deactivate", asyncHandler(trackingLinkController.deactivateTrackingLink));

  return router;
}
