import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createNotificationRoutes(
  notificationController: NotificationController,
) {
  const router = Router();

  router.use(requireAuth);
  router.get("/", asyncHandler(notificationController.getMyNotifications));
  router.patch("/:id/read", asyncHandler(notificationController.markAsRead));
  router.patch("/read-all", asyncHandler(notificationController.markAllAsRead));

  return router;
}
