import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
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

  return router;
}
