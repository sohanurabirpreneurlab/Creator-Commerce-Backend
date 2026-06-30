import { UserRole } from "../constants/roles.js";

export interface BaseAuthPayload {
  password: string;
}

export interface SignUpPayload extends BaseAuthPayload {
  name: string;
  email: string;
  mobileNumber: string;
  address: string;
  gender: string;
  dateOfBirth: string;
}

export interface LoginPayload extends BaseAuthPayload {
  identifier: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mobileNumber: string;
  address: string;
  gender: string;
  dateOfBirth: string;
  createdAt: string;
}

export interface AuthUserRecord extends AuthUser {
  passwordHash: string | null;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}
