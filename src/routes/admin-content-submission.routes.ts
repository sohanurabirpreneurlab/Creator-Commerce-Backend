import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { ContentSubmissionController } from "../controllers/content-submission.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createAdminContentSubmissionRoutes(
  contentSubmissionController: ContentSubmissionController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));
  router.get("/", asyncHandler(contentSubmissionController.getAdminContentSubmissions));
  router.get("/:id", asyncHandler(contentSubmissionController.getContentSubmissionById));
  router.patch("/:id/status", asyncHandler(contentSubmissionController.updateSubmissionStatus));

  return router;
}
