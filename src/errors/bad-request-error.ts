import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "./app-error.js";

export class BadRequestError extends AppError {
  constructor(
    message = "Bad request.",
    code = "BAD_REQUEST",
    details?: Record<string, unknown>,
  ) {
    super(message, {
      code,
      statusCode: HTTP_STATUS.BAD_REQUEST,
      details,
    });
    this.name = "BadRequestError";
  }
}
