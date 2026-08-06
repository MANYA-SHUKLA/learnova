import type { AuthUser, Session } from '@learnova/types';

export interface AuthSessionResponse {
  user: AuthUser;
  session: Session;
  accessToken: string;
  expiresIn: number;
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
