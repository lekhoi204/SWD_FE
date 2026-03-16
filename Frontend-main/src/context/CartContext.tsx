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
      const itemsWithId: CartItemWithId[] = (items as any[]).map((item: any) => {
        const cartItemId = item.cart_item_id || Date.now();
        return {
          ...item,
          cart_item_id: cartItemId,
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

  // Load cart on mount and when user changes
  useEffect(() => {
    if (user?.user_id) {
      loadCart();
    } else {
      setCart([]);
      setCartSummary(null);
    }
  }, [user?.user_id, loadCart]);

  const addToCart = useCallback(
    async (product: Product, quantity = 1, isBuild = false) => {
      if (!user?.user_id) {
        toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
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
      if (!user?.user_id) return;

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
      if (!user?.user_id) return;

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
    if (!user?.user_id) return;

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
