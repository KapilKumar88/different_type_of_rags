const fallbackApiBaseUrl = "http://localhost:3000";

export const envConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? fallbackApiBaseUrl,
} as const;
