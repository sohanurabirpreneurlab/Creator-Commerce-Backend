import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./app-error.js";

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed.",
    code = "VALIDATION_ERROR",
    details?: Record<string, unknown>,
  ) {
    super(message, {
      code,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      details,
    });
    this.name = "ValidationError";
  }
}
