import { apiClient } from "./client";

export type PcBuildItem = { product_id: number; quantity?: number };

export type PcBuildSummary = {
  pc_build_id: number;
  build_name: string;
  total_price?: number;
  item_count?: number;
  status?: string;
  image_url?: string;
};

export async function getPcBuilds(): Promise<PcBuildSummary[]> {
  const res = await apiClient<{ success: boolean; data: PcBuildSummary[] }>(
    "/pc-builds",
  );
  return res.data;
}

export async function getPcBuildById(id: string): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/pc-builds/${id}`,
  );
  return res.data;
}

export async function createPcBuild(data: {
  build_name: string;
  description?: string;
  category_id?: number | null;
  image_url?: string;
  status?: string;
  brand?: string;
  stock_quantity?: number;
  items: PcBuildItem[];
}): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>("/pc-builds", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updatePcBuild(id: string, data: any): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/pc-builds/${id}`,
    {
      method: "PUT",
      body: data,
    },
  );
  return res.data;
}

export async function deletePcBuild(id: string): Promise<void> {
  await apiClient(`/pc-builds/${id}`, { method: "DELETE" });
}

export async function addPcBuildItem(
  id: string,
  item: PcBuildItem,
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/pc-builds/${id}/items`,
    {
      method: "POST",
      body: item,
    },
  );
  return res.data;
}

export async function updatePcBuildItem(
  id: string,
  itemId: string,
  data: { quantity: number },
): Promise<any> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/pc-builds/${id}/items/${itemId}`,
    {
      method: "PUT",
      body: data,
    },
  );
  return res.data;
}

export async function deletePcBuildItem(
  id: string,
  itemId: string,
): Promise<void> {
  await apiClient(`/pc-builds/${id}/items/${itemId}`, { method: "DELETE" });
}
