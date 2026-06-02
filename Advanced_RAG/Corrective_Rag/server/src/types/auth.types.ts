import type { Request } from 'express';

export type SafeUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

export type AuthResult = {
  token: string;
  user: SafeUser;
};

export type CookieRequest = Request & {
  cookies?: Record<string, string | undefined>;
};
