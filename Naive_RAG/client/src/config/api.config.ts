import { envConfig } from "./env.config";

export const apiConfig = {
  baseUrl: envConfig.apiBaseUrl,
  endpoints: {
    auth: {
      register: "/api/v1/auth/register",
      login: "/api/v1/auth/login",
      me: "/api/v1/auth/me",
    },
  },
} as const;
