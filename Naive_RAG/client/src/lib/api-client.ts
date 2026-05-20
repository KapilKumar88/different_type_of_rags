import { apiConfig } from "@/config/api.config";
import type { ApiErrorResponse, CsrfResponse } from "@/types/auth.types";

type RequestOptions = Omit<RequestInit, "body" | "credentials"> & {
  body?: unknown;
};

export class ApiClientError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

let csrfToken: string | null = null;

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function isUnsafeMethod(method: string | undefined): boolean {
  const normalizedMethod = method?.toUpperCase() ?? "GET";

  return !["GET", "HEAD", "OPTIONS"].includes(normalizedMethod);
}

function shouldInvalidateCsrfToken(path: string): boolean {
  return [
    apiConfig.endpoints.auth.login,
    apiConfig.endpoints.auth.logout,
    apiConfig.endpoints.auth.register,
  ].includes(path);
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch(`${apiConfig.baseUrl}${apiConfig.endpoints.csrf}`, {
    credentials: "include",
  });
  const parsedResponse = (await parseResponse(response)) as Partial<CsrfResponse>;

  if (!response.ok || !parsedResponse.data?.csrfToken) {
    throw new ApiClientError("Unable to prepare request", response.status, parsedResponse);
  }

  csrfToken = parsedResponse.data.csrfToken;
  return csrfToken;
}

async function addCsrfHeader(path: string, options: RequestOptions, headers: Headers) {
  if (!isUnsafeMethod(options.method) || path === apiConfig.endpoints.csrf) {
    return;
  }

  headers.set("X-CSRF-Token", await getCsrfToken());
}

function isCsrfError(error: ApiClientError): boolean {
  return error.status === 403 && error.message === "Invalid CSRF token";
}

export const apiClient = {
  async request<TResponse>(
    path: string,
    options: RequestOptions = {},
    retryOnCsrfError = true,
  ): Promise<TResponse> {
    try {
      const headers = new Headers(options.headers);
      const isFormData = options.body instanceof FormData;

      if (options.body !== undefined && !isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const body =
        options.body === undefined || isFormData
          ? (options.body as BodyInit | undefined)
          : JSON.stringify(options.body);

      await addCsrfHeader(path, options, headers);

      const response = await fetch(`${apiConfig.baseUrl}${path}`, {
        ...options,
        headers,
        credentials: "include",
        body,
      });
      const parsedResponse = await parseResponse(response);

      if (!response.ok) {
        const errorResponse = parsedResponse as Partial<ApiErrorResponse>;
        throw new ApiClientError(
          errorResponse.message ?? "Request failed",
          response.status,
          parsedResponse,
        );
      }

      if (shouldInvalidateCsrfToken(path)) {
        csrfToken = null;
      }

      return parsedResponse as TResponse;
    } catch (error) {
      if (retryOnCsrfError && error instanceof ApiClientError && isCsrfError(error)) {
        csrfToken = null;
        return this.request<TResponse>(path, options, false);
      }

      throw error;
    }
  },

  get<TResponse>(path: string): Promise<TResponse> {
    return this.request<TResponse>(path, { method: "GET" });
  },

  post<TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: "POST",
      body: payload,
    });
  },

  patch<TResponse, TPayload>(path: string, payload: TPayload): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: "PATCH",
      body: payload,
    });
  },

  delete<TResponse>(path: string): Promise<TResponse> {
    return this.request<TResponse>(path, { method: "DELETE" });
  },
};
