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
  phone?: string;
  address?: string;
  avatar?: string;
};

type AuthResponse = {
  message?: string;
  user: User;
  token?: string;
};

export async function loginApi(data: LoginRequest): Promise<User> {
  clearToken();
  const res = await apiClient<{ message: string; token: string; user: User }>(
    "/auth/login",
    {
      method: "POST",
      body: data,
    },
  );
  if (res.token) setToken(res.token);
  return res.user;
}

export async function registerApi(data: RegisterRequest): Promise<User> {
  clearToken();
  const res = await apiClient<{ message: string; user: User }>(
    "/auth/register",
    {
      method: "POST",
      body: data,
    },
  );
  return res.user;
}

export async function logoutApi(): Promise<void> {
  clearToken();
}

export async function getMeApi(): Promise<User> {
  const res = await apiClient<{ message: string; user: User }>("/auth/me");
  return res.user;
}
