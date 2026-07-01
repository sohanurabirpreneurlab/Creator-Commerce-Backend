import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { ContentSubmissionController } from "../controllers/content-submission.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createCreatorContentRoutes(
  contentSubmissionController: ContentSubmissionController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.CREATOR));
  router.get("/", asyncHandler(contentSubmissionController.getMyContentSubmissions));

  return router;
}
