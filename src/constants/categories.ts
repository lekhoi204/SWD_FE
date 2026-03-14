/**
 * Category display names and mappings
 */

import type { ProductCategory } from "@/types";

export const CATEGORY_LABELS: Record<string, string> = {
  all: "Tất cả sản phẩm",
  cpu: "Bộ vi xử lý (CPU)",
  gpu: "Card đồ họa (GPU)",
  motherboard: "Bo mạch chủ",
  ram: "RAM",
  storage: "Ổ cứng",
  psu: "Bộ nguồn",
  case: "Case máy tính",
  cooling: "Hệ thống tản nhiệt",
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
