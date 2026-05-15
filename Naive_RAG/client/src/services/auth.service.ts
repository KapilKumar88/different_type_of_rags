import { apiConfig } from "@/config/api.config";
import { apiClient } from "@/lib/api-client";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth.types";

export const authService = {
  register(payload: RegisterPayload): Promise<AuthResponse> {
    return apiClient.post<AuthResponse, RegisterPayload>(
      apiConfig.endpoints.auth.register,
      payload,
    );
  },

  login(payload: LoginPayload): Promise<AuthResponse> {
    return apiClient.post<AuthResponse, LoginPayload>(apiConfig.endpoints.auth.login, payload);
  },

  me(): Promise<AuthResponse> {
    return apiClient.get<AuthResponse>(apiConfig.endpoints.auth.me);
  },
};
