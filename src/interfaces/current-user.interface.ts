import { UserRole } from "../constants/roles.js";

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  // brandId will be used later for brand manager ownership checks.
  brandId?: string;
  // creatorId will be used later when creator profiles are implemented.
  creatorId?: string;
}

// currentUser is the safe user shape attached to req.user after JWT verification.
