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
  clearToken();
  const res = await apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: data,
  });
  if (res.token) setToken(res.token);
  return res;
}

export async function registerApi(data: RegisterRequest): Promise<AuthResponse> {
  clearToken();
  const res = await apiClient<AuthResponse>('/auth/register', {
    method: 'POST',
    body: data,
  });
  if (res.token) setToken(res.token);
  return res;
}

