// ============================================
// Shared Types — User
// ============================================

export type UserRole = 'OWNER' | 'PARTNER';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  publicKey: string | null;
  identityKey: string | null;
  role: UserRole;
  createdAt: string;
  emailVerifiedAt: string | null;
}

export interface UserPublicInfo {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  publicKey: string | null;
  identityKey: string | null;
  role: UserRole;
}

export interface RegisterPayload {
  email: string;
  passwordHash: string; // SHA-256 pre-hashed on client
  displayName: string;
}

export interface LoginPayload {
  email: string;
  passwordHash: string; // SHA-256 pre-hashed on client
}

export interface AuthResponse {
  user: UserPublicInfo;
  accessToken: string;
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}
