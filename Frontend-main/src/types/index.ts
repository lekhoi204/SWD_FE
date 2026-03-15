/**
 * Shared types for the application
 */

export type ProductCategory =
  | "laptop"
  | "pc"
  | "cpu"
  | "gpu"
  | "ram"
  | "storage"
  | "motherboard"
  | "psu"
  | "case"
  | "cooling"
  | "monitor"
  | "keyboard"
  | "mouse";

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  category_id?: number;
  category_name?: string;
  price: number;
  image: string;
  description: string;
  specs: Record<string, string>;
  stock: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type ThemeMode = "dark" | "light";

export type UserRole = "admin" | "manager" | "staff" | "customer";

export type User = {
  user_id: number;
  name: string;
  email: string;
  role?: UserRole;
  phone?: string;
  address?: string | null;
  created_at: string;
};
