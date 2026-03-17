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
  stock?: number;
  stock_quantity?: number;
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

const CATEGORY_MAP: Record<string, ProductCategory> = {
  "graphics cards": "gpu",
  processors: "cpu",
  memory: "ram",
  storage: "storage",
  motherboards: "motherboard",
  "power supplies": "psu",
  cases: "case",
  laptops: "laptop",
  pcs: "pc",
  cpu: "cpu",
  vga: "gpu",
  mainboard: "motherboard",
  ram: "ram",
  ssd: "storage",
  hdd: "storage",
  psu: "psu",
  psd: "psu",
  case: "case",
  "vỏ máy tính": "case",
  "case máy tính": "case",
  "vỏ case": "case",
  cooling: "cooling",
  "tản nhiệt cpu": "cooling",
  "quạt tản nhiệt": "cooling",
  "hệ thống tản nhiệt": "cooling",
  "tản nhiệt": "cooling",
  monitor: "monitor",
  "màn hình": "monitor",
  keyboard: "keyboard",
  "bàn phím": "keyboard",
  mouse: "mouse",
  "chuột": "mouse",
  "chuột máy tính": "mouse",
  "pc bộ": "pc",
  "pc đồng bộ": "pc",
  "máy tính để bàn": "pc",
  laptop: "laptop",
  "bộ vi xử lý (cpu)": "cpu",
  "bộ vi xử lý": "cpu",
  "bộ xử lý": "cpu",
  "card đồ họa (gpu)": "gpu",
  "card đồ họa": "gpu",
  "card vga": "gpu",
  "ổ cứng": "storage",
  "ổ cứng ssd": "storage",
  "ổ cứng hdd": "storage",
  "bo mạch chủ": "motherboard",
  "bộ nguồn": "psu",
  "bộ nguồn máy tính": "psu",
  "nguồn máy tính": "psu",
};

function mapBackendProduct(bp: BackendProduct): Product {
  const rawName = (bp.category_name || "").trim().toLowerCase();
  const category: ProductCategory = rawName ? (CATEGORY_MAP[rawName] || "pc") : "pc";

  return {
    id: String(bp.product_id),
    name: bp.name,
    category,
    category_id: bp.category_id,
    category_name: bp.category_name?.trim() || undefined,
    price: bp.price,
    image: bp.image_url || "https://via.placeholder.com/400",
    description: bp.description || `${bp.brand || ""} ${bp.name}`.trim(),
    specs: bp.brand ? { Brand: String(bp.brand) } : {},
    stock: bp.stock ?? bp.stock_quantity ?? 0,
  };
}

export async function getProductsApi(
  params?: ProductListParams,
): Promise<Product[]> {
  const res = await apiClient<BackendProductsResponse>("/products", { params });
  return res.data.map(mapBackendProduct);
}

export async function getProductsByCategoryIdApi(
  categoryId: number,
): Promise<Product[]> {
  const res = await apiClient<BackendProductsResponse>(
    `/products/category/${categoryId}`,
  );
  return res.data.map(mapBackendProduct);
}

export async function getProductByIdApi(id: string): Promise<Product> {
  const res = await apiClient<BackendProductResponse>(`/products/${id}`);
  return mapBackendProduct(res.data);
}
