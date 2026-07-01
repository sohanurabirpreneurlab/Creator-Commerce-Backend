import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./app-error.js";

export class ConflictError extends AppError {
  constructor(
    message = "Conflict.",
    code = "CONFLICT",
    details?: Record<string, unknown>,
  ) {
    super(message, {
      code,
      statusCode: HTTP_STATUS.CONFLICT,
      details,
    });
    this.name = "ConflictError";
  }
}
