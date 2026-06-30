import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { USER_ROLES, UserRole } from "../constants/roles.js";
import { UnauthorizedError } from "../errors/unauthorized-error.js";

type JwtUserPayload = {
  id?: string;
  userId?: string;
  email?: string;
  role?: string;
};

function getBearerToken(request: Request) {
  const authorizationHeader = request.header("authorization");

  if (!authorizationHeader) {
    throw new UnauthorizedError(
      "Authorization header is required.",
      "AUTH_HEADER_MISSING",
    );
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new UnauthorizedError(
      "Authorization header must use Bearer token format.",
      "AUTH_INVALID_BEARER_FORMAT",
    );
  }

  return token;
}

function getValidRole(role: string | undefined): UserRole {
  if (!role) {
    throw new UnauthorizedError("Role is missing in token.", "AUTH_ROLE_MISSING");
  }

  if (!USER_ROLES.includes(role as UserRole)) {
    throw new UnauthorizedError("Role in token is invalid.", "AUTH_ROLE_INVALID");
  }

  return role as UserRole;
}

export function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const token = getBearerToken(request);
    const decoded = jwt.verify(token, env.jwtSecret) as JwtUserPayload;
    const userId = decoded.id ?? decoded.userId;

    if (!userId || !decoded.email) {
      throw new UnauthorizedError(
        "Token payload is incomplete.",
        "AUTH_TOKEN_INVALID",
      );
    }

    request.user = {
      id: userId,
      email: decoded.email,
      role: getValidRole(decoded.role),
    };

    return next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return next(error);
    }

    return next(
      new UnauthorizedError("Invalid or expired token.", "AUTH_TOKEN_INVALID"),
    );
  }
}
