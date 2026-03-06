import { apiClient, setToken, clearToken } from "./client";
import type { User } from "@/types";

type LoginRequest = {
  email: string;
  password: string;
};

type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

type AuthResponse = {
  user: User;
  token?: string;
};

export async function loginApi(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient<AuthResponse>("/auth/login", {
    method: "POST",
    body: data,
  });
  if (res.token) setToken(res.token);
  return res;
}

export async function registerApi(
  data: RegisterRequest,
): Promise<AuthResponse> {
  const res = await apiClient<AuthResponse>("/auth/register", {
    method: "POST",
    body: data,
  });
  if (res.token) setToken(res.token);
  return res;
}

export async function logoutApi(): Promise<void> {
  // Backend may not implement logout; clear token client-side.
  try {
    await apiClient("/auth/logout", { method: "POST" });
  } catch (err) {
    // ignore errors (endpoint might not exist)
  }
  clearToken();
}

export async function getMeApi(): Promise<User> {
  // Backend may not implement /auth/me. Let caller handle failures.
  return apiClient<User>("/auth/me");
}
