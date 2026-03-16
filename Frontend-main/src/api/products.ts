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

// Map backend product to frontend Product type
function mapBackendProduct(bp: BackendProduct): Product {
  const categoryMap: Record<string, ProductCategory> = {
    // English labels
    "Graphics Cards": "gpu",
    Processors: "cpu",
    Memory: "ram",
    Storage: "storage",
    Motherboards: "motherboard",
    "Power Supplies": "psu",
    Cases: "case",
    Laptops: "laptop",
    PCs: "pc",
    // Database exact names
    CPU: "cpu",
    VGA: "gpu",
    Mainboard: "motherboard",
    RAM: "ram",
    SSD: "storage",
    HDD: "storage",
    PSU: "psu",
    PSD: "psu",
    Case: "case",
    "Vỏ máy tính": "case",
    Cooling: "cooling",
    "Tản nhiệt CPU": "cooling",
    "Quạt tản nhiệt": "cooling",
    Monitor: "monitor",
    "Màn hình": "monitor",
    Keyboard: "keyboard",
    "Bàn phím": "keyboard",
    Mouse: "mouse",
    "Chuột": "mouse",
    "PC Bộ": "pc",
    // Vietnamese labels (backend may store Vietnamese names)
    "Bộ vi xử lý (CPU)": "cpu",
    "Bộ vi xử lý": "cpu",
    "Bộ xử lý": "cpu",
    "Card đồ họa (GPU)": "gpu",
    "Card đồ họa": "gpu",
    "Card VGA": "gpu",
    "Ổ cứng": "storage",
    "Ổ cứng SSD": "storage",
    "Ổ cứng HDD": "storage",
    "Bo mạch chủ": "motherboard",
    "Bộ nguồn": "psu",
    "Bộ nguồn máy tính": "psu",
    "Nguồn máy tính": "psu",
    "Case máy tính": "case",
    "Vỏ case": "case",
    "Hệ thống tản nhiệt": "cooling",
    "Tản nhiệt": "cooling",
    "Màn hình": "monitor",
    "Bàn phím": "keyboard",
    "Chuột máy tính": "mouse",
    Chuột: "mouse",
    Laptop: "laptop",
    "PC Đồng bộ": "pc",
    "Máy tính để bàn": "pc",
    // common lowercase variants
    "graphics cards": "gpu",
    processors: "cpu",
    memory: "ram",
    storage: "storage",
    motherboards: "motherboard",
    "power supplies": "psu",
    cases: "case",
    laptops: "laptop",
    pcs: "pc",
  };

  const rawName = bp.category_name?.trim() || "";
  const category = rawName
    ? categoryMap[rawName] || "pc"
    : "pc";

  return {
    id: String(bp.product_id),
    name: bp.name,
    category,
    category_id: bp.category_id,
    category_name: bp.category_name || undefined,
    price: bp.price,
    image: bp.image_url || "https://via.placeholder.com/400",
    description: bp.description || `${bp.brand || ""} ${bp.name}`.trim(),
    specs: bp.brand ? { Brand: bp.brand } : {},
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
