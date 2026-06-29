import { AuthUser } from "../interfaces/auth.interface.js";

export class AuthRepository {
  private readonly users = new Map<string, AuthUser & { password: string }>();

  public findByEmail(email: string) {
    return this.users.get(email.toLowerCase()) ?? null;
  }

  public findByIdentifier(identifier: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    for (const user of this.users.values()) {
      if (
        user.email.toLowerCase() === normalizedIdentifier ||
        user.mobileNumber.trim() === identifier.trim()
      ) {
        return user;
      }
    }

    return null;
  }

  public create(user: AuthUser & { password: string }) {
    this.users.set(user.email.toLowerCase(), user);
    return user;
  }
}
