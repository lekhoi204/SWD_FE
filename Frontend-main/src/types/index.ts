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
  | "cooler"
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
  status?: string;
  phone?: string | null;
  address?: string | null;
  avatar?: string | null;
  created_at: string;
};

export type OrderItem = {
  order_detail_id?: number;
  order_id?: number;
  product_id?: number;
  user_build_id?: number;
  quantity: number;
  price: number;
};

export type OrderDetail = {
  order_id: number;
  user_id: number;
  promotion_id: number | null;
  order_date: string;
  status: string;
  total_amount: number;
  shipping_address: string | null;
  payment_type: "One-time" | "Installment" | "COD";
  payment_method?: string | null;
  payment_id?: number | null;
  payment_status?: string | null;
  user_name?: string;
  user_email?: string;
  user_phone?: string | null;
  promotion_code?: string | null;
  order_items?: OrderItem[];
};

export type CartItemForOrder = {
  product_id?: number;
  user_build_id?: number;
  quantity: number;
  product_name?: string;
  product_price?: number;
  build_name?: string;
  build_price?: number;
  cart_item_id?: number;
};

export type PaymentInfo = {
  payment_id: number;
  order_id: number;
  payment_status: string;
  total_amount: number;
  payment_method?: string;
  order_status?: string;
};

export type VNPayData = {
  payment_id: number;
  payment_url?: string;
  bank_info?: {
    bank_name: string;
    account_no: string;
  };
  total_amount: number;
  qr_url?: string;
};

/** @deprecated Use VNPayData instead */
export type VietQRData = VNPayData;

export type InstallmentPlan = {
  id: string;
  months: number;
  interest: number;
  name: string;
};
