import { NextFunction, Request, Response } from "express";
import { UserRole } from "../constants/roles.js";
import { ForbiddenError } from "../errors/forbidden-error.js";
import { UnauthorizedError } from "../errors/unauthorized-error.js";

export function requireRole(...allowedRoles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    // requireAuth should run before requireRole.
    // requireRole only checks authorization, not authentication.
    if (!request.user) {
      return next(
        new UnauthorizedError(
          "Authentication is required before role checks.",
          "AUTH_USER_MISSING",
        ),
      );
    }

    if (!allowedRoles.includes(request.user.role)) {
      return next(
        new ForbiddenError("You do not have access to this resource."),
      );
    }

    return next();
  };
}
