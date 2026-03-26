import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import type { Product, CartItem } from '@/types';
import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  removeCartItemApi,
  clearCartApi,
} from '@/api/cart';
import { useAuth } from './AuthContext';

type CartItemWithId = CartItem & { cart_item_id: number };

type CartContextValue = {
  cart: CartItemWithId[];
  addToCart: (product: Product, quantity?: number, isBuild?: boolean) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
  itemCount: number;
  totalQuantity: number;
  total: number;
  isLoading: boolean;
  cartSummary: { itemCount: number; totalQuantity: number; totalPrice: number } | null;
};

const CartContext = createContext<CartContextValue | null>(null);

const GUEST_CART_KEY = "guestCart";

function loadGuestCartFromStorage(): CartItemWithId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const items: CartItem[] = JSON.parse(raw) ?? [];
    if (!Array.isArray(items)) return [];

    return items.map((item, idx) => ({
      ...item,
      cart_item_id: Date.now() + idx,
    }));
  } catch (e) {
    console.warn("Failed to parse guest cart from localStorage", e);
    return [];
  }
}

function saveGuestCartToStorage(items: CartItemWithId[]) {
  if (typeof window === "undefined") return;
  const simplified = items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
  }));
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(simplified));
}

function clearGuestCartFromStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_KEY);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItemWithId[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cartSummary, setCartSummary] = useState<{
    itemCount: number;
    totalQuantity: number;
    totalPrice: number;
  } | null>(null);

  // Load cart from API when user logs in
  const loadCart = useCallback(async () => {
    if (!user?.user_id) return;
    try {
      setIsLoading(true);
      const items = await getCartApi(String(user.user_id));
      const itemsWithId: CartItemWithId[] = (items as any[]).map((item: any, index: number) => {
        // Backend must return cart_item_id (or cartItemId/id/item_id) for remove/update to work
        const cartItemId = item.cart_item_id ?? item.cartItemId ?? item.id ?? item.item_id;
        const id = cartItemId != null ? Number(cartItemId) : Date.now() + index;
        return {
          ...item,
          cart_item_id: id,
        };
      });
      setCart(itemsWithId);

      // Calculate summary from items
      const summary = {
        itemCount: itemsWithId.length,
        totalQuantity: itemsWithId.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: itemsWithId.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),
      };
      setCartSummary(summary);
    } catch (error) {
      console.error('Failed to load cart:', error);
      // Don't show error toast on initial load
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id]);

  const mergeGuestCartToServer = useCallback(async () => {
    if (!user?.user_id) return;

    const guestItems = loadGuestCartFromStorage();
    if (guestItems.length === 0) return;

    for (const item of guestItems) {
      try {
        await addToCartApi(String(user.user_id), {
          product_id: parseInt(item.product.id),
          quantity: item.quantity,
        });
      } catch (err) {
        console.warn("Failed to merge guest item to server cart", item, err);
      }
    }

    clearGuestCartFromStorage();
  }, [user?.user_id]);

  const loadGuestCart = useCallback(() => {
    const items = loadGuestCartFromStorage();
    setCart(items);

    const summary = {
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    };
    setCartSummary(summary);
  }, []);

  // Load cart on mount and when user changes
  useEffect(() => {
    const initialize = async () => {
      if (user?.user_id) {
        await mergeGuestCartToServer();
        await loadCart();
      } else {
        loadGuestCart();
      }
    };

    void initialize();
  }, [user?.user_id, loadCart, mergeGuestCartToServer, loadGuestCart]);

  const addToCart = useCallback(
    async (product: Product, quantity = 1, isBuild = false) => {
      if (!user?.user_id) {
        // Guest flow: keep temporary cart locally.
        setCart((prev) => {
          const existing = prev.find((item) => item.product.id === product.id);
          let nextItems: CartItemWithId[];

          if (existing) {
            nextItems = prev.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            );
          } else {
            nextItems = [
              ...prev,
              {
                cart_item_id: Date.now(),
                product,
                quantity,
              },
            ];
          }

          saveGuestCartToStorage(nextItems);
          const summary = {
            itemCount: nextItems.length,
            totalQuantity: nextItems.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: nextItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
          };
          setCartSummary(summary);

          return nextItems;
        });

        return;
      }

      try {
        setIsLoading(true);
        const data = isBuild
          ? { user_build_id: parseInt(product.id), quantity }
          : { product_id: parseInt(product.id), quantity };

        const result = await addToCartApi(String(user.user_id), data);

        // Reload cart to sync with latest data
        await loadCart();
        toast.success('Đã thêm vào giỏ hàng');
      } catch (error: any) {
        console.error('Add to cart error:', error);
        toast.error(error.message || 'Không thể thêm vào giỏ hàng');
      } finally {
        setIsLoading(false);
      }
    },
    [user?.user_id, loadCart]
  );

  const updateQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      if (!user?.user_id) {
        setCart((prev) => {
          let nextItems = prev;
          if (quantity <= 0) {
            nextItems = prev.filter((item) => item.cart_item_id !== cartItemId);
          } else {
            nextItems = prev.map((item) =>
              item.cart_item_id === cartItemId ? { ...item, quantity } : item,
            );
          }
          saveGuestCartToStorage(nextItems);
          setCartSummary({
            itemCount: nextItems.length,
            totalQuantity: nextItems.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: nextItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
          });
          return nextItems;
        });
        return;
      }

      try {
        setIsLoading(true);
        if (quantity <= 0) {
          await removeFromCart(cartItemId);
          return;
        }

        await updateCartItemApi(String(cartItemId), { quantity });

        // Reload cart to sync
        await loadCart();
      } catch (error) {
        console.error('Update quantity error:', error);
        toast.error('Không thể cập nhật số lượng');
      } finally {
        setIsLoading(false);
      }
    },
    [user?.user_id, loadCart]
  );

  const removeFromCart = useCallback(
    async (cartItemId: number) => {
      if (!user?.user_id) {
        setCart((prev) => {
          const nextItems = prev.filter((item) => item.cart_item_id !== cartItemId);
          saveGuestCartToStorage(nextItems);
          setCartSummary({
            itemCount: nextItems.length,
            totalQuantity: nextItems.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: nextItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
          });
          return nextItems;
        });
        toast.success('Đã xóa khỏi giỏ hàng (tạm)');
        return;
      }

      try {
        setIsLoading(true);
        await removeCartItemApi(String(cartItemId));

        // Reload cart to sync
        await loadCart();
        toast.success('Đã xóa khỏi giỏ hàng');
      } catch (error) {
        console.error('Remove from cart error:', error);
        toast.error('Không thể xóa khỏi giỏ hàng');
      } finally {
        setIsLoading(false);
      }
    },
    [user?.user_id, loadCart]
  );

  const clearCartFn = useCallback(async () => {
    if (!user?.user_id) {
      setCart([]);
      setCartSummary(null);
      clearGuestCartFromStorage();
      toast.success('Đã xóa toàn bộ giỏ hàng tạm');
      return;
    }

    try {
      setIsLoading(true);
      await clearCartApi(String(user.user_id));
      setCart([]);
      setCartSummary(null);
      toast.success('Đã xóa toàn bộ giỏ hàng');
    } catch (error) {
      console.error('Clear cart error:', error);
      toast.error('Không thể xóa giỏ hàng');
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id]);

  const itemCount = cart.length;
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const value: CartContextValue = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart: clearCartFn,
    loadCart,
    itemCount,
    totalQuantity,
    total,
    isLoading,
    cartSummary,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
