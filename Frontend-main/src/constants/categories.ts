/**
 * Category display names and mappings
 */

import type { ProductCategory } from "@/types";

export const CATEGORY_LABELS: Record<string, string> = {
  all: "Tất cả sản phẩm",
  cpu: "Bộ vi xử lý",
  gpu: "Card đồ họa",
  motherboard: "Bo mạch chủ",
  ram: "Bộ nhớ RAM",
  storage: "Ổ cứng",
  psu: "Nguồn máy tính",
  case: "Vỏ máy tính",
  cooler: "Tản nhiệt CPU",
  /** Slug từ tên API "Tản nhiệt CPU" (getCategorySlug) */
  "tan-nhiet-cpu": "Tản nhiệt CPU",
  monitor: "Màn hình",
  keyboard: "Bàn phím",
  mouse: "Chuột máy tính",
  laptop: "Laptop",
  pc: "PC Đồng bộ",
};

export const PC_BUILDER_CATEGORIES: ProductCategory[] = [
  "cpu",
  "motherboard",
  "gpu",
  "ram",
  "storage",
  "psu",
  "case",
];

export const PC_BUILDER_LABELS: Record<ProductCategory, string> = {
  cpu: "Bộ vi xử lý (CPU)",
  gpu: "Card đồ họa (GPU)",
  ram: "RAM",
  storage: "Ổ cứng",
  motherboard: "Bo mạch chủ",
  psu: "Nguồn",
  case: "Case",
  laptop: "Laptop",
  pc: "PC Đồng bộ",
  cooling: "Tản nhiệt",
  monitor: "Màn hình",
  keyboard: "Bàn phím",
  mouse: "Chuột",
};
