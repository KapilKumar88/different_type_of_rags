import { apiConfig } from "@/config/api.config";
import type { ApiErrorResponse } from "@/types/auth.types";

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

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export const apiClient = {
  async request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
    const headers = new Headers(options.headers);

    if (options.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
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

    return parsedResponse as TResponse;
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
};
