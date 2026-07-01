import { Router } from "express";
import { CreatorSocialAccountController } from "../controllers/creator-social-account.controller.js";
import { UserRole } from "../constants/roles.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createCreatorSocialAccountRoutes(
  creatorSocialAccountController: CreatorSocialAccountController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.CREATOR));
  router.get("/", asyncHandler(creatorSocialAccountController.getMySocialAccounts));
  router.post("/", asyncHandler(creatorSocialAccountController.addSocialAccount));
  router.patch("/:id", asyncHandler(creatorSocialAccountController.updateSocialAccount));
  router.delete("/:id", asyncHandler(creatorSocialAccountController.deleteSocialAccount));

  return router;
}
