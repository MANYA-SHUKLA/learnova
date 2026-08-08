import type { AuthUser, Session } from '@learnova/types';

export interface AuthSessionResponse {
  user: AuthUser;
  session: Session;
  accessToken: string;
  expiresIn: number;
  /** HMAC-signed role hint for edge middleware (not for API authorization). */
  roleHint?: string | null;
}

export interface MessageResponse {
  message: string;
}

export interface MeResponse {
  user: AuthUser;
}

export interface CurrentSessionResponse {
  session: Session;
}

export interface SessionsListResponse {
  sessions: Session[];
}
