import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { createRbacTestRoutes } from "./rbac-test.routes.js";
import { asyncHandler } from "../utils/async-handler.js";
import { createAuthRoutes } from "./auth.routes.js";

export function createApiRouter(authController: AuthController) {
  const router = Router();

  router.get("/health", (_request, response) => {
    response.json({
      success: true,
      message: "API is healthy.",
      data: {
        service: "creator-commerce-backend",
      },
    });
  });

  router.use("/auth", createAuthRoutes(authController));
  router.get("/me", requireAuth, asyncHandler(authController.getCurrentUser));
  router.use("/rbac-test", createRbacTestRoutes());

  return router;
}
