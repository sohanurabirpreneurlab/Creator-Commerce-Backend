import { Router } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { UserRole } from "../constants/roles.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { sendSuccess } from "../utils/api-response.js";

export function createRbacTestRoutes() {
  const router = Router();

  // Temporary development routes for verifying RBAC behavior in API clients.
  router.get(
    "/creator",
    requireAuth,
    requireRole(
      UserRole.CREATOR,
      UserRole.BRAND_MANAGER,
      UserRole.SUPER_ADMIN,
    ),
    (request, response) =>
      sendSuccess(
        response,
        HTTP_STATUS.OK,
        "Creator route accessed successfully",
        {
          role: request.user!.role,
        },
      ),
  );

  // Temporary development routes for verifying RBAC behavior in API clients.
  router.get(
    "/brand-manager",
    requireAuth,
    requireRole(UserRole.BRAND_MANAGER, UserRole.SUPER_ADMIN),
    (request, response) =>
      sendSuccess(
        response,
        HTTP_STATUS.OK,
        "Brand manager route accessed successfully",
        {
          role: request.user!.role,
        },
      ),
  );

  // Temporary development routes for verifying RBAC behavior in API clients.
  router.get(
    "/super-admin",
    requireAuth,
    requireRole(UserRole.SUPER_ADMIN),
    (request, response) =>
      sendSuccess(
        response,
        HTTP_STATUS.OK,
        "Super admin route accessed successfully",
        {
          role: request.user!.role,
        },
      ),
  );

  return router;
}
