import { apiClient } from "./client";

export type Specification = {
  spec_id: number;
  product_id: number;
  spec_name: string;
  spec_value: string;
};

type GetSpecsResponse = {
  success: boolean;
  data: Specification[];
};

type MutateSpecResponse = {
  success: boolean;
  message: string;
  data: Specification;
};

export async function getSpecsByProductIdApi(
  productId: number | string,
): Promise<Specification[]> {
  const res = await apiClient<GetSpecsResponse>(
    `/specifications/product/${productId}`,
  );
  return res.data;
}

export async function createSpecApi(data: {
  product_id: number;
  spec_name: string;
  spec_value: string;
}): Promise<Specification> {
  const res = await apiClient<MutateSpecResponse>("/specifications", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updateSpecApi(
  specId: number,
  data: { spec_name?: string; spec_value?: string },
): Promise<Specification> {
  const res = await apiClient<MutateSpecResponse>(`/specifications/${specId}`, {
    method: "PUT",
    body: data,
  });
  const res = await apiClient<MutateSpecResponse>(
    `/specifications/${specId}`,
    { method: "PUT", body: data },
  );
  return res.data;
}

export async function deleteSpecApi(specId: number): Promise<void> {
  await apiClient(`/specifications/${specId}`, { method: "DELETE" });
}
