import { Router } from "express";
import { NotificationPreferenceController } from "../controllers/notification-preference.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createNotificationPreferenceRoutes(
  notificationPreferenceController: NotificationPreferenceController,
) {
  const router = Router();

  router.use(requireAuth);
  router.get("/", asyncHandler(notificationPreferenceController.getMyPreferences));
  router.patch("/", asyncHandler(notificationPreferenceController.updateMyPreferences));

  return router;
}
