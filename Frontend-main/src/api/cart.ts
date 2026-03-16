import { apiClient } from "./client";
import type { CartItem, Product } from "@/types";

type AddToCartRequest = {
  product_id?: number;
  user_build_id?: number;
  quantity?: number;
};

type UpdateCartItemRequest = {
  quantity: number;
};

function mapBackendProductToProduct(bp: any): Product {
  const categoryMap: Record<string, string> = {
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
    ? (categoryMap[bp.category_name] as any) || "pc"
    : "pc";

  return {
    id: String(bp.product_id ?? bp.product_id),
    name: bp.product_name ?? bp.name ?? "Unknown",
    category,
    price: bp.product_price ?? bp.price ?? 0,
    image: bp.image_url || "https://via.placeholder.com/400",
    description: bp.description || bp.product_name || "",
    specs: bp.brand ? { Brand: bp.brand } : {},
    stock: bp.stock ?? bp.stock_quantity ?? 0,
  };
}

function mapBackendCartItem(item: any): CartItem & { cart_item_id?: number } {
  // backend includes product fields (product_id, product_name, product_price, image_url, stock_quantity)
  // cart_item_id may be: cart_item_id, cartItemId, id, item_id
  const product = mapBackendProductToProduct(item);
  const cartItemId =
    item.cart_item_id ?? item.cartItemId ?? item.id ?? item.item_id;
  return {
    product,
    quantity: item.quantity ?? 1,
    ...(cartItemId != null && { cart_item_id: Number(cartItemId) }),
  };
}

export async function getCartApi(userId: string): Promise<(CartItem & { cart_item_id?: number })[]> {
  const res = await apiClient<{
    success: boolean;
    data: { items?: any[] } | any[];
  }>(`/cart/${userId}`);
  const rawItems = Array.isArray(res.data)
    ? res.data
    : (res.data?.items ?? []);
  return rawItems.map(mapBackendCartItem);
}

export async function addToCartApi(
  userId: string,
  data: AddToCartRequest,
): Promise<{ item: CartItem; cartSummary: any }> {
  // backend expects snake_case keys and endpoint /cart/:userId/add
  const res = await apiClient<{
    success: boolean;
    data: { item: any; cartSummary: any };
  }>(`/cart/${userId}/add`, { method: "POST", body: data });
  return {
    item: mapBackendCartItem(res.data.item),
    cartSummary: res.data.cartSummary,
  };
}

export async function updateCartItemApi(
  cartId: string,
  data: UpdateCartItemRequest,
): Promise<CartItem> {
  const res = await apiClient<{ success: boolean; data: any }>(
    `/cart/${cartId}/update`,
    { method: "PUT", body: data },
  );
  return mapBackendCartItem(res.data);
}

export async function removeCartItemApi(cartId: string): Promise<void> {
  await apiClient(`/cart/${cartId}/remove`, { method: "DELETE" });
}

export async function clearCartApi(userId: string): Promise<void> {
  await apiClient(`/cart/${userId}/clear`, { method: "DELETE" });
}

export async function getCartTotalApi(
  userId: string,
): Promise<{ itemCount: number; totalQuantity: number; totalPrice: number }> {
  const res = await apiClient<{
    success: boolean;
    data: { itemCount: number; totalQuantity: number; totalPrice: number };
  }>(`/cart/${userId}/total`);
  return res.data;
}
