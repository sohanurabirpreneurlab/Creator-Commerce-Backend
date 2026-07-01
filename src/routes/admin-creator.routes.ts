import { Router } from "express";
import { CreatorProfileController } from "../controllers/creator-profile.controller.js";
import { CreatorSocialAccountController } from "../controllers/creator-social-account.controller.js";
import { UserRole } from "../constants/roles.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createAdminCreatorRoutes(
  creatorProfileController: CreatorProfileController,
  creatorSocialAccountController: CreatorSocialAccountController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));
  router.get("/", asyncHandler(creatorProfileController.getCreators));
  router.get(
    "/:id/social-accounts",
    asyncHandler(creatorSocialAccountController.getSocialAccountsByCreatorProfileId),
  );
  router.get("/:id", asyncHandler(creatorProfileController.getCreatorProfileById));
  router.patch("/:id/status", asyncHandler(creatorProfileController.updateVerificationStatus));

  return router;
}
