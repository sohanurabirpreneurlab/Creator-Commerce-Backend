import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { sendError } from "../utils/api-response.js";

export function notFoundHandler(request: Request, response: Response) {
  return sendError(
    response,
    HTTP_STATUS.NOT_FOUND,
    `Route ${request.method} ${request.originalUrl} not found.`,
    "ROUTE_NOT_FOUND",
  );
}
