import { apiClient } from "./client";

export type Promotion = {
  promotion_id: number;
  code: string;
  discount_percent: number;
  valid_from: string | null;
  valid_to: string | null;
};

type GetPromotionsResponse = {
  success: boolean;
  data: Promotion[];
};

type GetPromotionResponse = {
  success: boolean;
  data: Promotion;
};

export async function getPromotionsApi(): Promise<Promotion[]> {
  const res = await apiClient<GetPromotionsResponse>("/promotions");
  return res.data;
}

export async function getPromotionByIdApi(id: number): Promise<Promotion> {
  const res = await apiClient<GetPromotionResponse>(`/promotions/${id}`);
  return res.data;
}

export async function getPromotionByCodeApi(code: string): Promise<Promotion> {
  const res = await apiClient<GetPromotionResponse>(`/promotions/code/${code}`);
  return res.data;
}

export async function createPromotionApi(data: {
  code: string;
  discount_percent: number;
  valid_from?: string;
  valid_to?: string;
}): Promise<Promotion> {
  const res = await apiClient<GetPromotionResponse>("/promotions", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updatePromotionApi(
  id: number,
  data: Partial<Promotion>,
): Promise<Promotion> {
  const res = await apiClient<GetPromotionResponse>(`/promotions/${id}`, {
    method: "PUT",
    body: data,
  });
  return res.data;
}

export async function deletePromotionApi(id: number): Promise<void> {
  await apiClient(`/promotions/${id}`, { method: "DELETE" });
}
