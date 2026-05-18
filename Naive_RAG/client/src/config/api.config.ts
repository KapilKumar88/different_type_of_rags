import { envConfig } from "./env.config";

export const apiConfig = {
  baseUrl: envConfig.apiBaseUrl,
  endpoints: {
    auth: {
      register: "/api/v1/auth/register",
      login: "/api/v1/auth/login",
      me: "/api/v1/auth/me",
    },
    documents: {
      upload: "/api/v1/documents/upload",
      list: "/api/v1/documents",
      delete: (id: string) => `/api/v1/documents/${id}`,
    },
  },
} as const;
