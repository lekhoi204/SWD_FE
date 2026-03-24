import { apiClient } from "./client";

export async function createQrFullPayment(): Promise<any> {
  const res = await apiClient<any>(`/payments/qr-full`, { method: "POST" });
  // Backend có thể trả { qr_url } hoặc { data: { qr_url } } — trả nguyên response để Checkout đọc được cả hai
  return res;
}

export async function createQrInstallmentPayment(months: number): Promise<any> {
  const res = await apiClient<any>(`/payments/qr-installment`, {
    method: "POST",
    body: { months },
  });
  return res;
}

export async function createCodPayment(): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/payments/cod`,
    { method: "POST" },
  );
  return res.data;
}

export async function confirmPayment(
  confirmation_message?: string,
): Promise<any> {
  const res = await apiClient<{ success?: boolean; data?: any }>(
    `/payments/confirm`,
    {
      method: "PATCH",
      body: confirmation_message != null ? { confirmation_message } : {},
    },
  );
  return res;
}

/** @deprecated Backend dùng PATCH /payments/admin/order/{orderId}/complete — dùng adminCompleteOrderPayment */
export async function adminCompletePayment(paymentId: number | string): Promise<any> {
  const res = await apiClient<{ success?: boolean; data?: any }>(
    `/payments/admin/${paymentId}/complete`,
    { method: "PATCH" },
  );
  return res;
}

/** Admin/Manager: xác nhận thanh toán & hoàn tất đơn theo mã đơn hàng */
export async function adminCompleteOrderPayment(orderId: number | string): Promise<any> {
  const res = await apiClient<{ success?: boolean; data?: any }>(
    `/payments/admin/order/${orderId}/complete`,
    { method: "PATCH" },
  );
  return res;
}

/** Admin/Manager: lấy danh sách đơn QR chờ xác nhận thanh toán */
export async function getPendingAdminCompletionApi(): Promise<any> {
  const res = await apiClient<{ success?: boolean; data?: any }>(
    `/payments/admin/pending-completion`,
  );
  return res;
}

export default {
  createQrFullPayment,
  createQrInstallmentPayment,
  createCodPayment,
  confirmPayment,
  adminCompletePayment,
  adminCompleteOrderPayment,
  getPendingAdminCompletionApi,
};
