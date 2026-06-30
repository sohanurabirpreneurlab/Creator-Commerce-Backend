import { CurrentUser } from "../interfaces/current-user.interface.js";
import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { LoginPayload, SignUpPayload } from "../interfaces/auth.interface.js";
import { AuthService } from "../services/auth.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public signUp = async (request: Request, response: Response) => {
    const payload = request.body as SignUpPayload;
    const result = await this.authService.signUp(payload);

    return sendSuccess(
      response,
      HTTP_STATUS.CREATED,
      "User registered successfully.",
      result,
    );
  };

  public login = async (request: Request, response: Response) => {
    const payload = request.body as LoginPayload;
    const result = await this.authService.login(payload);

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Login successful.",
      result,
    );
  };

  public getCurrentUser = async (request: Request, response: Response) => {
    const result = await this.authService.getCurrentUserProfile(
      request.user as CurrentUser,
    );

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Current user fetched successfully",
      result,
    );
  };
}
