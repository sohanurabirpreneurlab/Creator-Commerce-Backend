import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./app-error.js";

export class NotFoundError extends AppError {
  constructor(
    message = "Resource not found.",
    code = "NOT_FOUND",
    details?: Record<string, unknown>,
  ) {
    super(message, {
      code,
      statusCode: HTTP_STATUS.NOT_FOUND,
      details,
    });
    this.name = "NotFoundError";
  }
}
