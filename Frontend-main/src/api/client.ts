const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string>;
};

type OnUnauthorizedCallback = () => void;
let onUnauthorized: OnUnauthorizedCallback | null = null;

export function setOnUnauthorized(callback: OnUnauthorizedCallback) {
  onUnauthorized = callback;
}

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setToken(token: string) {
  localStorage.setItem("access_token", token);
}

export function clearToken() {
  localStorage.removeItem("access_token");
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {}, params } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const search = new URLSearchParams(params).toString();
    url += `?${search}`;
  }

  const token = getToken();
  const isFormData = body instanceof FormData;
  const requestHeaders: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...headers,
  };
  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);

    if (res.status === 401 && token) {
      onUnauthorized?.();
    }

    throw new ApiError(
      res.status,
      errorBody?.message || res.statusText,
      errorBody,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}
