import { apiClient } from "./client";
import type { OrderDetail as SharedOrderDetail } from "@/types";

export type CreateOrderRequest = {
  cart_item_ids: number[];
  shipping_address: string;
  phone: string;
  promotion_code?: string | null;
  payment_method: "QR_FULL" | "QR_INSTALLMENT" | "COD";
};

type CreateOrderResponse = {
  success: boolean;
  message: string;
  data: {
    order_id: number;
    payment_id: number;
    selected_cart_item_ids: number[];
    subtotal: number;
    discount_percent: number;
    discount_amount: number;
    total_amount: number;
    promotion_code: string | null;
    shipping_address: string;
    contact_phone: string;
    payment_type: string;
    payment_method: string;
  };
};

export async function createOrderApi(
  data: CreateOrderRequest,
): Promise<CreateOrderResponse["data"]> {
  const res = await apiClient<CreateOrderResponse>("/orders", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function getMyOrdersApi(): Promise<SharedOrderDetail[]> {
  const res = await apiClient<{ success: boolean; data: SharedOrderDetail[] }>(
    "/orders/me",
  );
  return res.data || [];
}

export async function getOrderByIdApi(
  orderId: string,
): Promise<SharedOrderDetail> {
  const res = await apiClient<{ success: boolean; data: SharedOrderDetail }>(
    `/orders/${orderId}`,
  );
  return res.data;
}

export async function getOrdersApi(): Promise<SharedOrderDetail[]> {
  const res = await apiClient<{ success: boolean; data: SharedOrderDetail[] }>(
    "/orders",
  );
  return res.data;
}

export async function updateOrderApi(
  id: string,
  data: Partial<SharedOrderDetail>,
): Promise<SharedOrderDetail> {
  const res = await apiClient<{
    success: boolean;
    message: string;
    data: SharedOrderDetail;
  }>(`/orders/${id}`, {
    method: "PUT",
    body: data,
  });
  return res.data;
}

export async function deleteOrderApi(id: string): Promise<void> {
  await apiClient(`/orders/${id}`, { method: "DELETE" });
}

export async function getOrdersByUserIdApi(
  userId: number,
): Promise<SharedOrderDetail[]> {
  const res = await apiClient<{ success: boolean; data: SharedOrderDetail[] }>(
    `/orders/user/${userId}`,
  );
  return res.data || [];
}
