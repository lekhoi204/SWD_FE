import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { getProductsApi } from "@/api/products";
import type { Product } from "@/types";
import { CATEGORY_LABELS } from "@/constants/categories";

const CATEGORY_IMAGES: Record<string, string> = {
  laptop:
    "https://file.hstatic.net/200000636033/file/icon1_ce115f32db874a8e9b5af39517176e96.png",
  pc: "https://file.hstatic.net/200000636033/file/icon3_5c59c1dc52ec4b81a94a3edba293e895.png",
  cpu: "https://file.hstatic.net/200000636033/file/icon6_056974287cd84e0d82eac05809b7e5d5.png",
  gpu: "https://file.hstatic.net/200000722513/file/asus-rog-strix-rtx4090-o24g-gaming-03_c948a4c2a9cf4adcbd522319bfcd4846.jpg",
  ram: "https://file.hstatic.net/200000636033/file/icon13_708c31c3ba56430dbec3f4cc7e1b14f0.png",
  storage:
    "https://file.hstatic.net/200000636033/file/icon11_2f0ea4c77ae3482f906591cec8f24cea.png",
  motherboard:
    "https://file.hstatic.net/200000636033/file/icon5_71200675c9e64c32a11730486ba04b32.png",
  psu: "https://file.hstatic.net/200000636033/file/icon9_ffd172460eb24c4d8bab6a7cd9a8cc46.png",
  case: "https://file.hstatic.net/200000636033/file/icon7_cdd85eba03974cb99a3941d076bf5d1b.png",
  cooling:
    "https://file.hstatic.net/200000636033/file/icon8_8f7b3fe2e8fb450b805857be9bb14edc.png",
  cooler:
    "https://file.hstatic.net/200000636033/file/icon8_8f7b3fe2e8fb450b805857be9bb14edc.png",
  monitor:
    "https://product.hstatic.net/200000722513/product/asus_pg27aqdm_gearvn_53c46bd0ca1f40f1a7abfb0246800081_e341bb95b0724bee845ba8f093678245_master.jpg",
  keyboard:
    "https://file.hstatic.net/200000722513/file/ban_phim_93a4d3cefd8345dfac23829818a3c5d4.jpg",
  mouse:
    "https://file.hstatic.net/200000722513/file/chuot_aa348bf0177b4795a39ab66d51e62ed7.jpg",
  headphone:
    "https://file.hstatic.net/200000722513/file/tai_nghe_ed3b4f52172f40929e1d3ab493099b73.jpg",
  speaker:
    "https://file.hstatic.net/200000636033/file/icon10_bfdf42150dbf45cfbcdf990b26f59691.png",
  hub: "https://file.hstatic.net/200000636033/file/icon19_0197366bbf124fed9b939c9b7075c2db.png",
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
    ([k]) =>
      k !== "all" &&
      k !== "psu" &&
      // Trùng label với `cooler`; slug này chỉ dùng cho URL/API
      k !== "tan-nhiet-cpu",
  );

  return (
    <div>
      {/* Banner - chỉ hiện ở trang chủ */}
      <div className="relative z-10 m-0 p-0" style={{ width: "100%", maxWidth: "none" }}>
        <img
          src="https://sf-static.upanhlaylink.com/img/image_202603197d3affa6338f668f996fb1795de59c49.jpg"
          alt="Banner"
          className="block w-full h-auto m-0 p-0 align-top border-0"
        />
      </div>

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
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center bg-white rounded-lg p-2">
                {CATEGORY_IMAGES[category] ? (
                  <img
                    src={CATEGORY_IMAGES[category]}
                    alt={label}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-4xl text-gray-500">📦</span>
                )}
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
                <div className="aspect-[4/3] w-full bg-white overflow-hidden flex items-center justify-center p-6 border-b border-gray-100/10">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
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
