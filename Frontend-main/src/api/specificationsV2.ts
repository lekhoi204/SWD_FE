import { apiClient } from "./client";

export async function getAllSpecSchemas(): Promise<any> {
  return await apiClient<{ success: boolean; data: any }>(
    "/specifications-v2/schemas",
  );
}

export async function getSpecSchema(category: string): Promise<any> {
  return await apiClient<{ success: boolean; data: any }>(
    `/specifications-v2/schema/${category}`,
  );
}

export async function validateSpecsApi(payload: {
  category: string;
  specs: Record<string, unknown>;
}): Promise<any> {
  return await apiClient<{ success: boolean; data: any }>(
    "/specifications-v2/validate",
    {
      method: "POST",
      body: payload,
    },
  );
}

export async function upsertJsonSpecsApi(payload: {
  product_id: number;
  category: string;
  specs: Record<string, unknown>;
}): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    "/specifications-v2/json",
    {
      method: "POST",
      body: payload,
    },
  );
  return res.data;
}

/**
 * GET /specifications-v2/json/:productId
 * Backend thường trả: { success, data: { product_id, specs: { socket: "...", ... } } }
 * Trả về object specs phẳng để UI map key → value (tránh [object Object] khi iterate data).
 */
export async function getJsonSpecsApi(
  productId: number | string,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/specifications-v2/json/${productId}`,
  );
  const data = res.data;
  if (
    data &&
    typeof data === "object" &&
    data.specs != null &&
    typeof data.specs === "object" &&
    !Array.isArray(data.specs)
  ) {
    return data.specs;
  }
  return data;
}

export async function updateJsonSpecsApi(
  productId: number | string,
  payload: { specs: Record<string, unknown> },
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/specifications-v2/json/${productId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  return res.data;
}

export async function deleteJsonSpecsApi(
  productId: number | string,
): Promise<void> {
  await apiClient(`/specifications-v2/json/${productId}`, { method: "DELETE" });
}

export async function getAllSpecsByCategoryApi(
  categoryId: number,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/specifications-v2/category/${categoryId}`,
  );
  return res.data;
}

// Legacy "traditional" helpers (deprecated endpoints)
export async function createTraditionalSpecApi(data: {
  product_id: number;
  spec_name: string;
  spec_value: string;
}): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    "/specifications-v2/traditional",
    {
      method: "POST",
      body: data,
    },
  );
  return res.data;
}

export async function getTraditionalByProductApi(
  productId: number,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/specifications-v2/traditional/${productId}`,
  );
  return res.data;
}

export async function updateTraditionalSpecApi(
  specId: number,
  data: { spec_name?: string; spec_value?: string },
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/specifications-v2/traditional/${specId}`,
    {
      method: "PATCH",
      body: data,
    },
  );
  return res.data;
}

export async function deleteTraditionalSpecApi(specId: number): Promise<void> {
  await apiClient(`/specifications-v2/traditional/${specId}`, {
    method: "DELETE",
  });
}

export default {
  getAllSpecSchemas,
  getSpecSchema,
  validateSpecsApi,
  upsertJsonSpecsApi,
  getJsonSpecsApi,
  updateJsonSpecsApi,
  deleteJsonSpecsApi,
  getAllSpecsByCategoryApi,
};
