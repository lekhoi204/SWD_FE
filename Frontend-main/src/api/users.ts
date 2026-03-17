import { apiClient } from "./client";

export type User = {
  user_id: number;
  name: string;
  email: string;
  role: "admin" | "customer" | "staff" | "manager";
  status: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  created_at: string;
};

type GetUsersResponse = {
  success: boolean;
  data: User[];
};

type GetUserResponse = {
  success: boolean;
  data: User;
};

type MutateUserResponse = {
  success: boolean;
  message: string;
  data: User;
};

export async function getUsersApi(): Promise<User[]> {
  const res = await apiClient<GetUsersResponse>("/users");
  return res.data;
}

export async function getUserByIdApi(id: number): Promise<User> {
  const res = await apiClient<GetUserResponse>(`/users/${id}`);
  return res.data;
}

export async function createUserApi(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  address?: string;
}): Promise<User> {
  const res = await apiClient<MutateUserResponse>("/users", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updateUserApi(
  id: number,
  data: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    status?: string;
    phone?: string;
    address?: string;
  },
): Promise<User> {
  const res = await apiClient<MutateUserResponse>(`/users/${id}`, {
    method: "PUT",
    body: data,
  });
  return res.data;
}

export async function deleteUserApi(id: number): Promise<void> {
  await apiClient(`/users/${id}`, { method: "DELETE" });
}
