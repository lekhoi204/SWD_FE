import { apiClient } from "./client";

export type Category = {
  category_id: number;
  name: string;
  description?: string | null;
};

type GetCategoriesResponse = {
  success: boolean;
  data: Category[];
};

type GetCategoryResponse = {
  success: boolean;
  data: Category;
};

type CreateCategoryResponse = {
  success: boolean;
  message: string;
  data: Category;
};

export async function getCategoriesApi(): Promise<Category[]> {
  const res = await apiClient<GetCategoriesResponse>("/categories");
  return res.data;
}

export async function getCategoryByIdApi(id: number): Promise<Category> {
  const res = await apiClient<GetCategoryResponse>(`/categories/${id}`);
  return res.data;
}

export async function createCategoryApi(data: {
  name: string;
  description?: string;
}): Promise<Category> {
  const res = await apiClient<CreateCategoryResponse>("/categories", {
    method: "POST",
    body: data,
  });
  return res.data;
}

export async function updateCategoryApi(
  id: number,
  data: { name?: string; description?: string },
): Promise<Category> {
  const res = await apiClient<CreateCategoryResponse>(`/categories/${id}`, {
    method: "PUT",
    body: data,
  });
  return res.data;
}

export async function deleteCategoryApi(id: number): Promise<void> {
  await apiClient(`/categories/${id}`, { method: "DELETE" });
}
