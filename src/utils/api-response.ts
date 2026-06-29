import { Response } from "express";
import {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "../interfaces/api-response.interface.js";

export function sendSuccess<T>(
  response: Response,
  statusCode: number,
  message: string,
  data: T,
  meta?: Record<string, unknown>,
) {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  };

  return response.status(statusCode).json(payload);
}

export function sendError(
  response: Response,
  statusCode: number,
  message: string,
  code: string,
  details?: Record<string, unknown>,
) {
  const payload: ApiErrorResponse = {
    success: false,
    message,
    error: {
      code,
      ...(details ? { details } : {}),
    },
  };

  return response.status(statusCode).json(payload);
}
