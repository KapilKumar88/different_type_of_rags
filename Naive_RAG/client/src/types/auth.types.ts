export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthData = {
  user: AuthUser;
};

export type ApiSuccessResponse<TData> = {
  success: true;
  message: string;
  data: TData;
};

export type ApiErrorResponse<TData = unknown> = {
  success: false;
  message: string;
  data: TData | null;
};

export type AuthResponse = ApiSuccessResponse<AuthData>;

export type LogoutResponse = ApiSuccessResponse<null>;

export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";
