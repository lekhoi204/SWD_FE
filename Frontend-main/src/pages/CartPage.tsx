import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, Loader } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useAuth } from "@/context/AuthContext";

export function CartPage() {
  const { isDark } = useTheme();
  const { user, openLogin, openRegister } = useAuth();
  const { cart, updateQuantity, removeFromCart, total, isLoading } = useCart();

  const subtotal = total;
  const shipping = subtotal > 0 ? (subtotal > 10000000 ? 0 : 200000) : 0;
  const finalTotal = subtotal + shipping;

  const guestWarning = (
    <div className={`mb-6 p-4 rounded-lg ${isDark ? "bg-purple-900/40" : "bg-purple-100"}`}>
      <p className={isDark ? "text-purple-200" : "text-gray-700"}>
        Bạn chưa đăng nhập, giỏ hàng hiện là tạm thời. Sau khi đăng nhập/đăng ký, sản phẩm sẽ tự động đồng bộ vào giỏ hàng của bạn.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={openLogin}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white text-sm font-semibold"
        >
          Đăng nhập
        </button>
        <button
          onClick={openRegister}
          className="px-4 py-2 border border-purple-300 rounded-lg text-sm font-semibold"
        >
          Đăng ký
        </button>
      </div>
    </div>
  );

  if (isLoading && cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <Loader className={`w-16 h-16 animate-spin mx-auto mb-6 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          {!user && guestWarning}
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 ${isDark ? "bg-purple-500/20" : "bg-purple-100"}`}>
            <ShoppingBag className={`w-16 h-16 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
          </div>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}>Giỏ hàng trống</h2>
          <p className={`mb-8 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Chưa có sản phẩm nào trong giỏ hàng của bạn
          </p>
          <Link
            to="/products"
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform text-white"
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
      {!user && guestWarning}
      <h1 className={`text-3xl md:text-4xl font-bold mb-8 ${isDark ? "bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent" : "text-black"}`}>
        Giỏ hàng của bạn
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.cart_item_id}
              className={`rounded-xl border p-4 md:p-6 ${isDark ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm border-purple-500/30" : "bg-white border-gray-200 shadow-sm"}`}
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className={`w-full md:w-32 h-40 md:h-32 rounded-lg flex items-center justify-center overflow-hidden shrink-0 ${isDark ? "bg-white border border-gray-100/10" : "bg-gray-50 border border-gray-200"}`}>
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold text-lg ${isDark ? "text-white" : "text-black"}`}>{item.product.name}</h3>
                    <button
                      onClick={() => removeFromCart(item.cart_item_id)}
                      disabled={isLoading}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-500 hover:bg-red-50"}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className={`text-sm mb-4 line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {item.product.description}
                  </p>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateQuantity(item.cart_item_id, item.quantity - 1)
                        }
                        disabled={isLoading}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${isDark ? "bg-purple-500/30 hover:bg-purple-500/50" : "bg-purple-100 hover:bg-purple-200 text-purple-600"}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`text-xl font-bold w-12 text-center ${isDark ? "text-white" : "text-black"}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.cart_item_id, item.quantity + 1)
                        }
                        disabled={
                          isLoading || item.quantity >= item.product.stock
                        }
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${isDark ? "bg-purple-500/30 hover:bg-purple-500/50" : "bg-purple-100 hover:bg-purple-200 text-purple-600"}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {item.product.price.toLocaleString("vi-VN")}₫ x{" "}
                        {item.quantity}
                      </div>
                      <div className={`text-2xl font-bold ${isDark ? "text-purple-400" : "text-purple-600"}`}>
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
          <div className={`rounded-xl border p-6 sticky top-24 ${isDark ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm border-purple-500/30" : "bg-white border-gray-200 shadow-sm"}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? "text-purple-400" : "text-purple-600"}`}>
              Tổng đơn hàng
            </h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>Tạm tính:</span>
                <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {subtotal.toLocaleString("vi-VN")}₫
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>Phí vận chuyển:</span>
                <span className={`font-semibold ${isDark ? "text-white" : "text-black"}`}>
                  {shipping === 0 ? (
                    <span className={isDark ? "text-green-400" : "text-green-600"}>Miễn phí</span>
                  ) : (
                    `${shipping.toLocaleString("vi-VN")}₫`
                  )}
                </span>
              </div>
              {subtotal < 10000000 && subtotal > 0 && (
                <div className={`text-sm p-3 rounded-lg border ${isDark ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" : "text-yellow-700 bg-yellow-50 border-yellow-200"}`}>
                  Mua thêm {(10000000 - subtotal).toLocaleString("vi-VN")}₫ để
                  được miễn phí vận chuyển
                </div>
              )}
              <div className={`pt-4 border-t ${isDark ? "border-purple-500/30" : "border-gray-200"}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-lg font-semibold ${isDark ? "text-white" : "text-black"}`}>Tổng cộng:</span>
                  <span className={`text-3xl font-bold ${isDark ? "text-purple-400" : "text-purple-600"}`}>
                    {finalTotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/checkout"
              className="block w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg mb-3 text-center text-white"
            >
              Tiến hành thanh toán
            </Link>
            <Link
              to="/products"
              className={`block w-full py-3 rounded-lg font-semibold transition-colors text-center ${isDark ? "bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white" : "bg-gray-100 hover:bg-gray-200 border border-gray-300 text-black"}`}
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
