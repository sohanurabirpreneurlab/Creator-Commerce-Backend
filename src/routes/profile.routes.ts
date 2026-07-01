import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createProfileRoutes(profileController: ProfileController) {
  const router = Router();

  router.use(requireAuth);
  router.get("/", asyncHandler(profileController.getMyProfile));
  router.patch("/", asyncHandler(profileController.updateMyProfile));

  return router;
}
