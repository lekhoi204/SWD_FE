import { apiClient } from "./client";
import type { Product, ProductCategory } from "@/types";

type ProductListParams = {
  category?: string;
  search?: string;
  page?: string;
  limit?: string;
  sort?: string;
};

type BackendProduct = {
  product_id: number;
  name: string;
  category_id: number;
  brand?: string;
  price: number;
  stock: number;
  image_url?: string;
  created_at?: string;
  category_name?: string;
  description?: string;
};

type BackendProductsResponse = {
  success: boolean;
  data: BackendProduct[];
};

type BackendProductResponse = {
  success: boolean;
  data: BackendProduct;
};

// Map backend product to frontend Product type
function mapBackendProduct(bp: BackendProduct): Product {
  const categoryMap: Record<string, ProductCategory> = {
    "Graphics Cards": "gpu",
    Processors: "cpu",
    Memory: "ram",
    Storage: "storage",
    Motherboards: "motherboard",
    "Power Supplies": "psu",
    Cases: "case",
    Laptops: "laptop",
    PCs: "pc",
  };

  const category = bp.category_name
    ? categoryMap[bp.category_name] || "pc"
    : "pc";

  return {
    id: String(bp.product_id),
    name: bp.name,
    category,
    price: bp.price,
    image: bp.image_url || "https://via.placeholder.com/400",
    description: bp.description || `${bp.brand || ""} ${bp.name}`.trim(),
    specs: bp.brand ? { Brand: bp.brand } : {},
    stock: bp.stock,
  };
}

export async function getProductsApi(
  params?: ProductListParams,
): Promise<Product[]> {
  const res = await apiClient<BackendProductsResponse>("/products", { params });
  return res.data.map(mapBackendProduct);
}

export async function getProductByIdApi(id: string): Promise<Product> {
  const res = await apiClient<BackendProductResponse>(`/products/${id}`);
  return mapBackendProduct(res.data);
}
