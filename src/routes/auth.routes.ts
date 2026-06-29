import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import {
  validateLoginRequest,
  validateSignUpRequest,
} from "../middleware/auth-request-validator.js";
import { asyncHandler } from "../utils/async-handler.js";

export function createAuthRoutes(authController: AuthController) {
  const router = Router();

  router.post("/signup", validateSignUpRequest, asyncHandler(authController.signUp));
  router.post("/login", validateLoginRequest, asyncHandler(authController.login));

  return router;
}
