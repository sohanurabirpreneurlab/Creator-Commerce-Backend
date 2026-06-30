import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "../errors/app-error.js";
import { UnauthorizedError } from "../errors/unauthorized-error.js";
import { UserRole } from "../constants/roles.js";
import {
  AuthResult,
  AuthUser,
  AuthUserRecord,
  LoginPayload,
  SignUpPayload,
} from "../interfaces/auth.interface.js";
import { CurrentUser } from "../interfaces/current-user.interface.js";
import { AuthRepository } from "../repositories/auth.repository.js";

type AuthTokenPayload = {
  id: string;
  email: string;
  role: UserRole;
};

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  public async signUp(payload: SignUpPayload): Promise<AuthResult> {
    this.validateSignUpPayload(payload);

    const existingUser = await this.authRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new AppError("User already exists with this email.", {
        code: "AUTH_USER_ALREADY_EXISTS",
        statusCode: HTTP_STATUS.CONFLICT,
      });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 12);

    const createdUser = await this.authRepository.create({
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      // Public signup is intentionally restricted to CREATOR.
      // Brand managers and superadmins should be created or promoted by admin flow later,
      // or manually during development while that flow does not exist yet.
      role: UserRole.CREATOR,
      mobileNumber: payload.mobileNumber.trim(),
      address: payload.address.trim(),
      gender: payload.gender.trim(),
      dateOfBirth: payload.dateOfBirth,
      passwordHash: hashedPassword,
    });

    return {
      user: this.sanitizeUser(createdUser),
      token: this.generateToken(createdUser),
    };
  }

  public async login(payload: LoginPayload): Promise<AuthResult> {
    this.validateLoginPayload(payload);

    const existingUser = await this.authRepository.findByIdentifier(
      payload.identifier,
    );
    if (!existingUser) {
      throw new AppError("Invalid email or password.", {
        code: "AUTH_INVALID_CREDENTIALS",
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      existingUser.passwordHash ?? "",
    );

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password.", {
        code: "AUTH_INVALID_CREDENTIALS",
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    return {
      user: this.sanitizeUser(existingUser),
      token: this.generateToken(existingUser),
    };
  }

  public async getCurrentUserProfile(currentUser: CurrentUser) {
    const existingUser = await this.authRepository.findById(currentUser.id);

    if (!existingUser) {
      throw new UnauthorizedError(
        "Authenticated user could not be found.",
        "AUTH_USER_NOT_FOUND",
      );
    }

    const safeUser = this.sanitizeUser(existingUser);

    return {
      user: {
        id: safeUser.id,
        name: safeUser.name,
        email: safeUser.email,
        role: safeUser.role,
      },
    };
  }

  private validateSignUpPayload(payload: SignUpPayload) {
    const requiredFields: Array<keyof SignUpPayload> = [
      "name",
      "email",
      "password",
      "mobileNumber",
      "address",
      "gender",
      "dateOfBirth",
    ];

    for (const field of requiredFields) {
      if (!payload[field]?.trim()) {
        throw new AppError(`${field} is required.`, {
          code: "AUTH_VALIDATION_ERROR",
          statusCode: HTTP_STATUS.BAD_REQUEST,
          details: { field },
        });
      }
    }

    this.validateEmail(payload.email);
    this.validatePassword(payload.password);
  }

  private validateLoginPayload(payload: LoginPayload) {
    if (!payload.identifier?.trim() || !payload.password?.trim()) {
      throw new AppError("Identifier and password are required.", {
        code: "AUTH_VALIDATION_ERROR",
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }

    this.validateIdentifier(payload.identifier);
    this.validatePassword(payload.password);
  }

  private validateEmail(email: string) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      throw new AppError("Please provide a valid email address.", {
        code: "AUTH_INVALID_EMAIL",
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
  }

  private validatePassword(password: string) {
    if (password.trim().length < 8) {
      throw new AppError("Password must be at least 8 characters.", {
        code: "AUTH_WEAK_PASSWORD",
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
  }

  private validateIdentifier(identifier: string) {
    const trimmedIdentifier = identifier.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const mobilePattern = /^[+]?[\d\s\-()]{8,20}$/;

    if (
      !emailPattern.test(trimmedIdentifier) &&
      !mobilePattern.test(trimmedIdentifier)
    ) {
      throw new AppError("Please provide a valid email or mobile number.", {
        code: "AUTH_INVALID_IDENTIFIER",
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
  }

  private sanitizeUser(user: AuthUserRecord): AuthUser {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private generateToken(user: AuthUserRecord) {
    const payload: AuthTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: "7d",
    });
  }
}
