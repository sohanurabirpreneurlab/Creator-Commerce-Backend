import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "../errors/app-error.js";
import { sendError } from "../utils/api-response.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof AppError) {
    return sendError(
      response,
      error.statusCode,
      error.message,
      error.code,
      error.details,
    );
  }

  console.error("[UnhandledError]", error);

  return sendError(
    response,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    "Something went wrong.",
    "INTERNAL_SERVER_ERROR",
  );
}
