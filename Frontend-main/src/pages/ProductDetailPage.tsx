import { useState, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { getProductByIdApi } from "@/api/products";
import { getSpecsByProductIdApi, type Specification } from "@/api/specifications";
import { CATEGORY_LABELS } from "@/constants/categories";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Product } from "@/types";

const PAYMENT_PLANS = [
  { id: "full", name: "Thanh toán toàn bộ", months: 0, interest: 0 },
  { id: "3-months", name: "Trả góp 3 tháng", months: 3, interest: 0 },
  { id: "6-months", name: "Trả góp 6 tháng", months: 6, interest: 0 },
  { id: "12-months", name: "Trả góp 12 tháng", months: 12, interest: 0 },
  { id: "18-months", name: "Trả góp 18 tháng", months: 18, interest: 2 },
  { id: "24-months", name: "Trả góp 24 tháng", months: 24, interest: 3 },
];

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isDark } = useTheme();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedPaymentPlan, setSelectedPaymentPlan] =
    useState<string>("full");
  const [product, setProduct] = useState<Product | null>(null);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [data, specs] = await Promise.all([
          getProductByIdApi(id),
          getSpecsByProductIdApi(id).catch(() => []),
        ]);
        if (mounted) {
          setProduct(data);
          setSpecifications(specs);
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        if (mounted) setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (notFound || (!loading && !product))
    return <Navigate to="/products" replace />;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div
            className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? "border-purple-400" : "border-purple-600"}`}
          />
          <p className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Đang tải sản phẩm...
          </p>
        </div>
      </div>
    );
  }

  if (!product) return <Navigate to="/products" replace />;

  const selectedPlan = PAYMENT_PLANS.find((p) => p.id === selectedPaymentPlan)!;
  const totalPrice = product.price * quantity;
  const totalWithInterest = totalPrice * (1 + selectedPlan.interest / 100);
  const monthlyPayment =
    selectedPlan.months > 0
      ? totalWithInterest / selectedPlan.months
      : totalPrice;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`Đã thêm ${quantity} ${product.name} vào giỏ hàng!`);
  };

  const categoryLabel = CATEGORY_LABELS[product.category] ?? product.category;

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Sản phẩm", to: "/products" },
          { label: categoryLabel, to: `/products/${product.category}` },
          { label: product.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {product.name}
            </h1>
            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-4xl font-bold text-purple-400">
                {product.price.toLocaleString("vi-VN")}₫
              </span>
              {product.stock > 0 ? (
                <span className="text-green-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Còn hàng ({product.stock})
                </span>
              ) : (
                <span className="text-red-400">Hết hàng</span>
              )}
            </div>
            <p className="text-gray-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          {specifications.length > 0 && (
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
              <h3 className="text-xl font-bold mb-4 text-purple-400">
                Thông số kỹ thuật
              </h3>
              <div className="space-y-3">
                {specifications.map((spec) => (
                  <div
                    key={spec.spec_id}
                    className="flex justify-between border-b border-purple-500/20 pb-2"
                  >
                    <span className="text-gray-400">{spec.spec_name}</span>
                    <span className="font-semibold text-right">{spec.spec_value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
            <h3 className="text-xl font-bold mb-4 text-purple-400">
              Phương thức thanh toán
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPaymentPlan(plan.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPaymentPlan === plan.id
                      ? "border-purple-400 bg-purple-500/20"
                      : "border-purple-500/30 bg-purple-900/20 hover:border-purple-400/50"
                  }`}
                >
                  <div className="font-semibold mb-1">{plan.name}</div>
                  {plan.months > 0 && (
                    <div className="text-sm text-gray-400">
                      {plan.interest > 0
                        ? `Lãi suất ${plan.interest}%`
                        : "Lãi suất 0%"}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {selectedPlan.months > 0 && (
              <div className="mt-4 p-4 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <div className="text-sm text-gray-300 mb-2">
                  Trả góp {selectedPlan.months} tháng
                  {selectedPlan.interest > 0 &&
                    ` (Lãi suất ${selectedPlan.interest}%)`}
                </div>
                <div className="text-2xl font-bold text-blue-400">
                  {monthlyPayment.toLocaleString("vi-VN")}₫/tháng
                </div>
                {selectedPlan.interest > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    Tổng thanh toán: {totalWithInterest.toLocaleString("vi-VN")}
                    ₫
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-sm rounded-xl border border-purple-500/30 p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="font-semibold">Số lượng:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center hover:bg-purple-500/50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-bold w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className="w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center hover:bg-purple-500/50 transition-colors"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mb-4 p-4 bg-slate-900/50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Tạm tính:</span>
                <span className="font-semibold">
                  {totalPrice.toLocaleString("vi-VN")}₫
                </span>
              </div>
              {selectedPlan.interest > 0 && (
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">
                    Lãi suất ({selectedPlan.interest}%):
                  </span>
                  <span className="font-semibold">
                    {(totalWithInterest - totalPrice).toLocaleString("vi-VN")}₫
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-purple-400 pt-2 border-t border-purple-500/30">
                <span>Tổng cộng:</span>
                <span>
                  {(selectedPlan.interest > 0
                    ? totalWithInterest
                    : totalPrice
                  ).toLocaleString("vi-VN")}
                  ₫
                </span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-purple-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <ShoppingCart className="w-5 h-5" />
              {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
