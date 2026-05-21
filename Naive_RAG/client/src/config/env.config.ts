const fallbackApiBaseUrl = "http://localhost:3000";

function getApiBaseUrl(): string {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (apiBaseUrl) {
    return apiBaseUrl;
  }

  if (import.meta.env.PROD) {
    throw new Error("VITE_API_BASE_URL is required for production client builds.");
  }

  return fallbackApiBaseUrl;
}

export const envConfig = {
  apiBaseUrl: getApiBaseUrl(),
} as const;
