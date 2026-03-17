import { apiClient } from "./client";

export async function createQrFullPayment(): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/payments/qr-full`,
    { method: "POST" },
  );
  return res.data;
}

export async function createQrInstallmentPayment(months: number): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/payments/qr-installment`,
    { method: "POST", body: { months } },
  );
  return res.data;
}

export async function createCodPayment(): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/payments/cod`,
    { method: "POST" },
  );
  return res.data;
}

export async function confirmPayment(
  confirmation_message: string,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/payments/confirm`,
    {
      method: "PATCH",
      body: { confirmation_message },
    },
  );
  return res.data;
}

export default {
  createQrFullPayment,
  createQrInstallmentPayment,
  createCodPayment,
  confirmPayment,
};
