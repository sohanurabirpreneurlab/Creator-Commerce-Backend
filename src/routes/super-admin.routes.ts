import { Router } from "express";
import { UserRole } from "../constants/roles.js";
import { SuperAdminController } from "../controllers/super-admin.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createSuperAdminRoutes(
  superAdminController: SuperAdminController,
) {
  const router = Router();

  router.use(requireAuth, requireRole(UserRole.SUPER_ADMIN));
  router.get("/summary", asyncHandler(superAdminController.getPlatformSummary));
  router.get("/users", asyncHandler(superAdminController.getUsersWithRoles));
  router.get("/users/:id", asyncHandler(superAdminController.getUserDetails));
  router.patch(
    "/users/:id/role",
    asyncHandler(superAdminController.updateUserRole),
  );
  router.patch(
    "/users/:id/status",
    asyncHandler(superAdminController.updateUserStatus),
  );
  router.get(
    "/roles/breakdown",
    asyncHandler(superAdminController.getRoleBreakdown),
  );

  return router;
}
