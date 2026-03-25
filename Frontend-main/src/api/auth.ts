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

const LOGIN_ERROR_MAP: Record<string, string> = {
  "Invalid email or password": "Email hoặc mật khẩu không đúng",
  "User not found": "Tài khoản không tồn tại",
  "Account is disabled": "Tài khoản đã bị vô hiệu hóa",
};

export async function loginApi(data: LoginRequest): Promise<User> {
  clearToken();
  try {
    const res = await apiClient<{ message: string; token: string; user: User }>(
      "/auth/login",
      {
        method: "POST",
        body: data,
      },
    );
    if (res.token) setToken(res.token);
    return res.user;
  } catch (err: unknown) {
    if (err instanceof Error) {
      const vnMessage = LOGIN_ERROR_MAP[err.message];
      if (vnMessage) throw new Error(vnMessage);
    }
    throw err;
  }
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

type GoogleLoginRequest = {
  email: string;
};

export async function googleLoginApi(data: GoogleLoginRequest): Promise<User> {
  clearToken();
  const res = await apiClient<{ message?: string; token?: string; user: User }>(
    "/auth/google-login",
    {
      method: "POST",
      body: data,
    },
  );
  if (res.token) setToken(res.token);
  return res.user;
}
