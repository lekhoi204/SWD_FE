import { apiClient } from "./client";

type CreateOrderRequest = {
  cart_item_ids: number[];
  shipping_address: string;
  phone: string;
  promotion_code?: string | null;
  payment_method: "QR_FULL" | "QR_INSTALLMENT" | "COD";
};

type OrderDetail = {
  order_id: number;
  user_id: number;
  promotion_id: number | null;
  order_date: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
  payment_type: string;
  payment_method: string | null;
  user_name?: string;
  user_email?: string;
  user_phone?: string | null;
  promotion_code?: string | null;
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

export async function getOrdersApi(): Promise<OrderDetail[]> {
  const res = await apiClient<{ success: boolean; data: OrderDetail[] }>(
    "/orders",
  );
  return res.data;
}

export async function getOrderByIdApi(id: string): Promise<OrderDetail> {
  const res = await apiClient<{ success: boolean; data: OrderDetail }>(
    `/orders/${id}`,
  );
  return res.data;
}

export async function updateOrderApi(
  id: string,
  data: Partial<OrderDetail>,
): Promise<OrderDetail> {
  const res = await apiClient<{
    success: boolean;
    message: string;
    data: OrderDetail;
  }>(`/orders/${id}`, {
    method: "PUT",
    body: data,
  });
  return res.data;
}

export async function deleteOrderApi(id: string): Promise<void> {
  await apiClient(`/orders/${id}`, { method: "DELETE" });
}
