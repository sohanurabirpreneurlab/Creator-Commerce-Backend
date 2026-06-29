import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { sendError } from "../utils/api-response.js";

function isNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateSignUpRequest(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const fields = [
    "name",
    "email",
    "password",
    "mobileNumber",
    "address",
    "gender",
    "dateOfBirth",
  ] as const;

  for (const field of fields) {
    if (!isNonEmptyString(request.body[field])) {
      return sendError(
        response,
        HTTP_STATUS.BAD_REQUEST,
        `${field} is required.`,
        "AUTH_VALIDATION_ERROR",
        { field },
      );
    }
  }

  return next();
}

export function validateLoginRequest(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (
    !isNonEmptyString(request.body.identifier) ||
    !isNonEmptyString(request.body.password)
  ) {
    return sendError(
      response,
      HTTP_STATUS.BAD_REQUEST,
      "Identifier and password are required.",
      "AUTH_VALIDATION_ERROR",
    );
  }

  return next();
}
