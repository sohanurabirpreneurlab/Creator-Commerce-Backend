import { Request, Response } from "express";
import { HTTP_STATUS } from "../constants/http-status.js";
import { LoginPayload, SignUpPayload } from "../interfaces/auth.interface.js";
import { AuthService } from "../services/auth.service.js";
import { sendSuccess } from "../utils/api-response.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public signUp = (request: Request, response: Response) => {
    const payload = request.body as SignUpPayload;
    const result = this.authService.signUp(payload);

    return sendSuccess(
      response,
      HTTP_STATUS.CREATED,
      "User registered successfully.",
      result,
    );
  };

  public login = (request: Request, response: Response) => {
    const payload = request.body as LoginPayload;
    const result = this.authService.login(payload);

    return sendSuccess(
      response,
      HTTP_STATUS.OK,
      "Login successful.",
      result,
    );
  };
}
