const fallbackApiBaseUrl = "http://localhost:3000";
const defaultDocumentUploadTimeoutMs = 10 * 60 * 1000;

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error("VITE_DOCUMENT_UPLOAD_TIMEOUT_MS must be a positive integer.");
  }

  return parsedValue;
}

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
  documentUploadTimeoutMs: parsePositiveInteger(
    import.meta.env.VITE_DOCUMENT_UPLOAD_TIMEOUT_MS,
    defaultDocumentUploadTimeoutMs,
  ),
} as const;
