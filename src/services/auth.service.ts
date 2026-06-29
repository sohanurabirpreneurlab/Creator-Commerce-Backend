import { HTTP_STATUS } from "../constants/http-status.js";
import { AppError } from "../errors/app-error.js";
import {
  AuthResult,
  AuthUser,
  LoginPayload,
  SignUpPayload,
} from "../interfaces/auth.interface.js";
import { AuthRepository } from "../repositories/auth.repository.js";

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  public signUp(payload: SignUpPayload): AuthResult {
    this.validateSignUpPayload(payload);

    const existingUser = this.authRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new AppError("User already exists with this email.", {
        code: "AUTH_USER_ALREADY_EXISTS",
        statusCode: HTTP_STATUS.CONFLICT,
      });
    }

    const user: AuthUser & { password: string } = {
      id: crypto.randomUUID(),
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      mobileNumber: payload.mobileNumber.trim(),
      address: payload.address.trim(),
      gender: payload.gender.trim(),
      dateOfBirth: payload.dateOfBirth,
      password: payload.password,
      createdAt: new Date().toISOString(),
    };

    this.authRepository.create(user);

    return {
      user: this.sanitizeUser(user),
      token: this.generateToken(user.email),
    };
  }

  public login(payload: LoginPayload): AuthResult {
    this.validateLoginPayload(payload);

    const existingUser = this.authRepository.findByIdentifier(payload.identifier);
    if (!existingUser || existingUser.password !== payload.password) {
      throw new AppError("Invalid email or password.", {
        code: "AUTH_INVALID_CREDENTIALS",
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    return {
      user: this.sanitizeUser(existingUser),
      token: this.generateToken(existingUser.email),
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

  private sanitizeUser(user: AuthUser & { password: string }): AuthUser {
    const { password: _password, ...safeUser } = user;
    return safeUser;
  }

  private generateToken(email: string) {
    return Buffer.from(`${email}:${Date.now()}`).toString("base64");
  }
}
