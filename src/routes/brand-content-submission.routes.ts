import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { ContentSubmissionController } from "../controllers/content-submission.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createBrandContentSubmissionRoutes(
  contentSubmissionController: ContentSubmissionController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.BRAND_MANAGER));
  router.get("/", asyncHandler(contentSubmissionController.getBrandContentSubmissions));
  router.get("/:id", asyncHandler(contentSubmissionController.getContentSubmissionById));
  router.patch("/:id/approve", asyncHandler(contentSubmissionController.approveSubmission));
  router.patch("/:id/reject", asyncHandler(contentSubmissionController.rejectSubmission));
  router.patch(
    "/:id/request-changes",
    asyncHandler(contentSubmissionController.requestChanges),
  );

  return router;
}
