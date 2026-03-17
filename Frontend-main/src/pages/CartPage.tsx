import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, Loader } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAuth } from "@/context/AuthContext";

export function CartPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, total, isLoading } = useCart();

  const subtotal = total;
  const shipping = subtotal > 0 ? (subtotal > 10000000 ? 0 : 200000) : 0;
  const finalTotal = subtotal + shipping;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-32 h-32 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-16 h-16 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Cần đăng nhập</h2>
          <p className="text-gray-400 mb-8">
            Vui lòng đăng nhập để xem giỏ hàng của bạn
          </p>
          <Link
            to="/products"
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <Loader className="w-16 h-16 text-purple-400 animate-spin mx-auto mb-6" />
          <p className="text-gray-400">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-32 h-32 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-16 h-16 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Giỏ hàng trống</h2>
          <p className="text-gray-400 mb-8">
            Chưa có sản phẩm nào trong giỏ hàng của bạn
          </p>
          <Link
            to="/products"
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: "Giỏ hàng" }]} />
      <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
        Giỏ hàng của bạn
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.cart_item_id}
              className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-4 md:p-6"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-full md:w-32 h-40 md:h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{item.product.name}</h3>
                    <button
                      onClick={() => removeFromCart(item.cart_item_id)}
                      disabled={isLoading}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {item.product.description}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.cart_item_id, item.quantity - 1)
                        }
                        disabled={isLoading}
                        className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center hover:bg-purple-500/50 transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xl font-bold w-12 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.cart_item_id, item.quantity + 1)
                        }
                        disabled={
                          isLoading || item.quantity >= item.product.stock
                        }
                        className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center hover:bg-purple-500/50 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        {item.product.price.toLocaleString("vi-VN")}₫ x{" "}
                        {item.quantity}
                      </div>
                      <div className="text-2xl font-bold text-purple-400">
                        {(item.product.price * item.quantity).toLocaleString(
                          "vi-VN",
                        )}
                        ₫
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6 sticky top-24">
            <h2 className="text-2xl font-bold mb-6 text-purple-400">
              Tổng đơn hàng
            </h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Tạm tính:</span>
                <span className="font-semibold">
                  {subtotal.toLocaleString("vi-VN")}₫
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phí vận chuyển:</span>
                <span className="font-semibold">
                  {shipping === 0 ? (
                    <span className="text-green-400">Miễn phí</span>
                  ) : (
                    `${shipping.toLocaleString("vi-VN")}₫`
                  )}
                </span>
              </div>
              {subtotal < 10000000 && subtotal > 0 && (
                <div className="text-sm text-yellow-400 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
                  Mua thêm {(10000000 - subtotal).toLocaleString("vi-VN")}₫ để
                  được miễn phí vận chuyển
                </div>
              )}
              <div className="pt-4 border-t border-purple-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Tổng cộng:</span>
                  <span className="text-3xl font-bold text-purple-400">
                    {finalTotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/checkout"
              className="block w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-purple-500/50 mb-3 text-center"
            >
              Tiến hành thanh toán
            </Link>
            <Link
              to="/products"
              className="block w-full py-3 bg-white/10 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20 text-center"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
