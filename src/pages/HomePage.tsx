import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Rocket, Zap, Shield, Star } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { getProductsApi } from "@/api/products";
import type { Product } from "@/types";
import { CATEGORY_LABELS } from "@/constants/categories";

const CATEGORY_ICONS: Record<string, string> = {
  laptop: "💻",
  pc: "🖥️",
  cpu: "🔲",
  gpu: "🎮",
  ram: "🧠",
  storage: "💾",
  motherboard: "⚡",
  psu: "🔋",
};

export function HomePage() {
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getProductsApi();
        if (mounted) {
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const featuredProducts = products.slice(0, 6);
  const categories = Object.entries(CATEGORY_LABELS).filter(
    ([k]) => k !== "all",
  );

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-purple-500/20 px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-purple-500/30">
              <Star className="w-4 h-4 text-yellow-400" />
              <span
                className={`text-sm ${isDark ? "text-gray-200" : "text-gray-700"}`}
              >
                Khám phá công nghệ từ vũ trụ
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Công nghệ vượt thời gian
            </h1>
            <p
              className={`text-xl md:text-2xl mb-8 ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              Laptop, PC và linh kiện điện tử cao cấp với giá tốt nhất
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/50 text-center"
              >
                Khám phá sản phẩm
              </Link>
              <Link
                to="/builder"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20 text-center"
              >
                Build PC ngay
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-40 h-40 bg-blue-500/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            className={`backdrop-blur-sm p-6 rounded-xl hover:scale-105 transition-transform ${
              isDark
                ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30"
                : "bg-white/60 border border-purple-300 shadow-lg"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isDark ? "bg-purple-500/30" : "bg-purple-200"}`}
            >
              <Rocket
                className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-purple-600"}`}
              />
            </div>
            <h3
              className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Giao hàng siêu tốc
            </h3>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              Giao hàng nhanh chóng trong vòng 24h tại các thành phố lớn
            </p>
          </div>
          <div
            className={`backdrop-blur-sm p-6 rounded-xl hover:scale-105 transition-transform ${
              isDark
                ? "bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30"
                : "bg-white/60 border border-blue-300 shadow-lg"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isDark ? "bg-blue-500/30" : "bg-blue-200"}`}
            >
              <Zap
                className={`w-6 h-6 ${isDark ? "text-blue-400" : "text-blue-600"}`}
              />
            </div>
            <h3
              className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Trả góp 0%
            </h3>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              Hỗ trợ trả góp 0% lãi suất với nhiều gói linh hoạt
            </p>
          </div>
          <div
            className={`backdrop-blur-sm p-6 rounded-xl hover:scale-105 transition-transform ${
              isDark
                ? "bg-gradient-to-br from-pink-900/40 to-pink-800/20 border border-pink-500/30"
                : "bg-white/60 border border-pink-300 shadow-lg"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isDark ? "bg-pink-500/30" : "bg-pink-200"}`}
            >
              <Shield
                className={`w-6 h-6 ${isDark ? "text-pink-400" : "text-pink-600"}`}
              />
            </div>
            <h3
              className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Bảo hành chính hãng
            </h3>
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              Bảo hành chính hãng đầy đủ, hỗ trợ kỹ thuật tận tâm
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Danh mục sản phẩm
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(([category, label]) => (
            <Link
              key={category}
              to={category === "all" ? "/products" : `/products/${category}`}
              className={`backdrop-blur-sm p-6 rounded-xl hover:scale-105 transition-all text-center ${
                isDark
                  ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 hover:border-purple-400/50"
                  : "bg-white/60 border border-purple-300 hover:border-purple-500 shadow-lg"
              }`}
            >
              <div className="text-4xl mb-2">
                {CATEGORY_ICONS[category] ?? "📦"}
              </div>
              <div
                className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {label}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Sản phẩm nổi bật
        </h2>
        {loading ? (
          <div className="text-center py-12">
            <div
              className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? "border-purple-400" : "border-purple-600"}`}
            />
            <p className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Đang tải sản phẩm...
            </p>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              Chưa có sản phẩm nào
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product: Product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className={`backdrop-blur-sm rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer group block ${
                  isDark
                    ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30"
                    : "bg-white/60 border border-purple-300 shadow-lg"
                }`}
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3
                    className={`font-bold text-lg mb-2 line-clamp-2 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {product.name}
                  </h3>
                  <p
                    className={`text-sm mb-4 line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-2xl font-bold ${isDark ? "text-purple-400" : "text-purple-600"}`}
                    >
                      {product.price.toLocaleString("vi-VN")}₫
                    </span>
                    <span className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-sm font-semibold text-white">
                      Xem chi tiết
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Link
            to="/products"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/50 text-white"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      </section>
    </div>
  );
}
