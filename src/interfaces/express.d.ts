import { CurrentUser } from "./current-user.interface.js";

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}

export {};
