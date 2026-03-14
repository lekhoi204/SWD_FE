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
