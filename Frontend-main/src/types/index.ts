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

export type VietQRData = {
  payment_id: number;
  bank_info: {
    bank_name: string;
    account_no: string;
  };
  total_amount: number;
  qr_url: string;
};

export type InstallmentPlan = {
  id: string;
  months: number;
  interest: number;
  name: string;
};
