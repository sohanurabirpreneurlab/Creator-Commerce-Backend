import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { TrackingLinkController } from "../controllers/tracking-link.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createCreatorTrackingRoutes(
  trackingLinkController: TrackingLinkController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.CREATOR));
  router.get("/", asyncHandler(trackingLinkController.getMyTrackingLinks));
  router.get("/:id", asyncHandler(trackingLinkController.getTrackingLinkById));

  return router;
}
