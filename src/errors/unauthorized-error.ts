import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./app-error.js";

export class UnauthorizedError extends AppError {
  constructor(
    message = "Unauthorized.",
    code = "AUTH_UNAUTHORIZED",
    details?: Record<string, unknown>,
  ) {
    super(message, {
      code,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
      details,
    });
    this.name = "UnauthorizedError";
  }
}
