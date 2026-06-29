import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { AuthController } from "./controllers/auth.controller.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { AuthRepository } from "./repositories/auth.repository.js";
import { createApiRouter } from "./routes/index.js";
import { AuthService } from "./services/auth.service.js";

export function createApp() {
  const app = express();

  const authRepository = new AuthRepository();
  const authService = new AuthService(authRepository);
  const authController = new AuthController(authService);

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.json({
      success: true,
      message: "Creators Commerce backend is running.",
      data: null,
    });
  });

  app.use("/api", createApiRouter(authController));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
