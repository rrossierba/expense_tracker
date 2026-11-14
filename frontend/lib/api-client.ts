import { authStorage } from "./auth-storage";
import { TokenResponse } from "../types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export class ApiClientError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>;
  skipAuth?: boolean;
  authRetried?: boolean;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

async function refreshAccessToken(): Promise<string> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    authStorage.clearTokens();
    throw new ApiClientError(401, "No refresh token available");
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    authStorage.clearTokens();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:expired"));
    }
    throw new ApiClientError(response.status, "Session expired, please login again");
  }

  const data: TokenResponse = await response.json();
  authStorage.setTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    params,
    skipAuth = false,
    authRetried = false,
    headers = {},
    ...customConfig
  } = options;

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!skipAuth) {
    const token = authStorage.getAccessToken();
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    throw new ApiClientError(0, message);
  }

  // Handle token expiration (401 Unauthorized)
  if (
    response.status === 401 &&
    !skipAuth &&
    !authRetried &&
    !endpoint.includes("/auth/")
  ) {
    const getToken = isRefreshing
      ? new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
      : (async () => {
          isRefreshing = true;
          try {
            const token = await refreshAccessToken();
            processQueue(null, token);
            return token;
          } catch (refreshError: unknown) {
            const error =
              refreshError instanceof Error
                ? refreshError
                : new Error("Session refresh failed");
            processQueue(error);
            throw error;
          } finally {
            isRefreshing = false;
          }
        })();

    const newToken = await getToken;
    return apiClient<T>(endpoint, {
      ...options,
      authRetried: true,
      headers: { ...headers, Authorization: `Bearer ${newToken}` },
    });
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    let errorData = null;
    try {
      errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch {
      // response body was not JSON
    }
    throw new ApiClientError(response.status, errorDetail, errorData);
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  return response.json();
}

// Convenience REST methods
export const api = {
  get: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: "GET" }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiClient<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    apiClient<T>(endpoint, { ...options, method: "DELETE" }),
};

