import { apiClient } from "./client";

export async function testAI(): Promise<any> {
  const res = await apiClient<{ success: boolean; data?: any }>("/ai/test");
  return res;
}

export async function analyzeApi(query: string): Promise<any> {
  const res = await apiClient<{ success: boolean; data?: any }>("/ai/analyze", {
    method: "POST",
    body: { query },
  });
  return res;
}

export async function getRecommendationsApi(
  requirements: string,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data?: any }>(
    "/ai/recommendations",
    {
      method: "POST",
      body: { requirements },
    },
  );
  return res;
}

export async function buildPcApi(query: string): Promise<any> {
  const res = await apiClient<{ success: boolean; data?: any }>("/ai/build", {
    method: "POST",
    body: { query },
  });
  return res;
}

export default { testAI, analyzeApi, getRecommendationsApi, buildPcApi };
