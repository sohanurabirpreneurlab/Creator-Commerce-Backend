import { Router } from "express";
import { CreatorProfileController } from "../controllers/creator-profile.controller.js";
import { UserRole } from "../constants/roles.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createCreatorProfileRoutes(
  creatorProfileController: CreatorProfileController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.CREATOR));
  router.get("/profile", asyncHandler(creatorProfileController.getMyProfile));
  router.post("/profile", asyncHandler(creatorProfileController.createMyProfile));
  router.patch("/profile", asyncHandler(creatorProfileController.updateMyProfile));

  return router;
}
