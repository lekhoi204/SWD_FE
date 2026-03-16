import { apiClient } from "./client";

export type UserBuildItem = { product_id: number; quantity?: number };

export async function createUserBuild(
  userId: number,
  data: { build_name: string; items: UserBuildItem[] },
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/user-builds?user_id=${userId}`,
    {
      method: "POST",
      body: data,
    },
  );
  return res.data;
}

export async function getUserBuilds(userId: number): Promise<any[]> {
  const res = await apiClient<{ success: boolean; data: any[] }>(
    `/user-builds?user_id=${userId}`,
  );
  return res.data;
}

export async function getUserBuildById(id: string): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/user-builds/${id}`,
  );
  return res.data;
}

export async function updateUserBuild(id: string, data: any): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/user-builds/${id}`,
    {
      method: "PUT",
      body: data,
    },
  );
  return res.data;
}

export async function deleteUserBuild(id: string): Promise<void> {
  await apiClient(`/user-builds/${id}`, { method: "DELETE" });
}

export async function addUserBuildItem(
  id: string,
  item: UserBuildItem,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/user-builds/${id}/items`,
    {
      method: "POST",
      body: item,
    },
  );
  return res.data;
}

export async function updateUserBuildItem(
  id: string,
  itemId: string,
  data: { quantity: number },
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/user-builds/${id}/items/${itemId}`,
    {
      method: "PUT",
      body: data,
    },
  );
  return res.data;
}

export async function deleteUserBuildItem(
  id: string,
  itemId: string,
): Promise<void> {
  await apiClient(`/user-builds/${id}/items/${itemId}`, { method: "DELETE" });
}
