import { apiClient } from "./client";

export async function getOnlineQr(): Promise<{ qr_url: string } | any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/payments/online/qr`,
  );
  return res.data;
}

export async function getInstallmentQr(months: number): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/payments/installment/qr`,
    {
      method: "POST",
      body: { months },
    },
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
