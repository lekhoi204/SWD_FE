import { apiClient } from "./client";

type CheckoutRequest = {
  shipping_address: string;
};

type CheckoutResponse = {
  success: boolean;
  message: string;
  data: {
    order_id: number;
    payment_id: number;
    total_amount: number;
    items_count: number;
  };
};

/**
 * Create ORDER, ORDER_DETAIL, and PAYMENT from user's cart
 * This endpoint uses all items currently in the user's cart
 */
export async function checkoutApi(
  data: CheckoutRequest,
): Promise<CheckoutResponse["data"]> {
  const res = await apiClient<CheckoutResponse>("/checkout", {
    method: "POST",
    body: data,
  });
  return res.data;
}
