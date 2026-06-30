import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./app-error.js";

export class ForbiddenError extends AppError {
  constructor(
    message = "Forbidden.",
    code = "AUTH_FORBIDDEN",
    details?: Record<string, unknown>,
  ) {
    super(message, {
      code,
      statusCode: HTTP_STATUS.FORBIDDEN,
      details,
    });
    this.name = "ForbiddenError";
  }
}
