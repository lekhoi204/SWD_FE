import { apiClient } from "./client";

export async function checkBuildApi(
  payload: Record<string, unknown>,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    "/compatibility/check-build",
    {
      method: "POST",
      body: payload,
    },
  );
  return res.data;
}

export async function validatePairApi(payload: {
  productId1: number;
  productId2: number;
  rule: string;
}): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    "/compatibility/validate-pair",
    {
      method: "POST",
      body: payload,
    },
  );
  return res.data;
}

export async function getRecommendationsApi(
  productId: number | string,
  category: string,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/compatibility/recommendations/${productId}/${category}`,
  );
  return res.data;
}

export async function getCompatibleProductsApi(
  category: string,
  filters?: Record<string, unknown>,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/compatibility/compatible-products/${category}`,
    {
      method: "POST",
      body: filters || {},
    },
  );
  return res.data;
}

export async function autoBuildApi(payload: {
  budget: number;
  purpose?: string;
  cpuPreference?: string;
  gpuPreference?: string;
  storageSize?: number;
}): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    "/compatibility/auto-build",
    {
      method: "POST",
      body: payload,
    },
  );
  return res.data;
}

export async function getRulesApi(): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    "/compatibility/rules",
  );
  return res.data;
}

export async function getRuleInfoApi(ruleId: number): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/compatibility/rules/${ruleId}`,
  );
  return res.data;
}

export async function getBuildExamplesApi(): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    "/compatibility/build-examples",
  );
  return res.data;
}

export async function getBudgetAllocationApi(): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    "/compatibility/budget-allocation",
  );
  return res.data;
}

export default {
  checkBuildApi,
  validatePairApi,
  getRecommendationsApi,
  getCompatibleProductsApi,
  autoBuildApi,
  getRulesApi,
  getRuleInfoApi,
  getBuildExamplesApi,
  getBudgetAllocationApi,
};
