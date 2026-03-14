import { useState, useMemo, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Filter, Grid, List } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { getProductsApi, getProductsByCategoryIdApi } from "@/api/products";
import { getCategoriesApi } from "@/api/categories";
import { CATEGORY_LABELS } from "@/constants/categories";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Product } from "@/types";

export function ProductListPage() {
  const { category: categoryParam } = useParams<{ category?: string }>();
  const category = categoryParam ?? "all";
  const { isDark } = useTheme();
  const { addToCart } = useCart();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "default" | "price-asc" | "price-desc" | "name"
  >("default");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0, 100000000,
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCategoryFetch, setIsCategoryFetch] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setIsCategoryFetch(false);
        // If category is provided (not 'all'), try to resolve backend category id
        if (category !== "all") {
          try {
            const categories = await getCategoriesApi();
            const targetLabel = CATEGORY_LABELS[category] ?? category;

            // Normalizes strings for robust matching (remove diacritics, spaces, punctuation)
            const normalize = (s: string) =>
              String(s)
                .toLowerCase()
                .normalize("NFD")
                .replace(/\p{Diacritic}/gu, "")
                .replace(/[^a-z0-9]/g, "");

            const targetNorm = normalize(targetLabel);
            const keyNorm = normalize(category);

            // find by normalized equality or inclusion
            let matched = categories.find((c) => {
              if (!c || !c.name) return false;
              const nameNorm = normalize(String(c.name));
              return (
                nameNorm === targetNorm ||
                nameNorm === keyNorm ||
                nameNorm.includes(targetNorm) ||
                targetNorm.includes(nameNorm) ||
                nameNorm.includes(keyNorm)
              );
            });

            console.debug("Fetched categories for matching:", categories);
            console.debug(
              "Category param:",
              category,
              "targetLabel:",
              targetLabel,
              "matched:",
              matched,
            );

            if (matched) {
              const data = await getProductsByCategoryIdApi(
                matched.category_id,
              );
              if (mounted) {
                setProducts(data);
                setIsCategoryFetch(true);
              }
            } else {
              const data = await getProductsApi();
              if (mounted) setProducts(data);
            }
          } catch (err) {
            // On any error, fallback to fetch all and filter client-side
            console.error(
              "Category lookup failed, falling back to all products",
              err,
            );
            const data = await getProductsApi();
            if (mounted) setProducts(data);
          }
        } else {
          const data = await getProductsApi();
          if (mounted) {
            setProducts(data);
          }
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
  }, [category]);

  const filteredProducts = useMemo(() => {
    // If products are fetched from category API, no need to filter by category again
    // since backend already filtered them
    let filtered = isCategoryFetch
      ? products
      : category === "all"
        ? products
        : products.filter((p) => p.category === category);
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1],
    );
    switch (sortBy) {
      case "price-asc":
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case "name":
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return filtered;
  }, [category, sortBy, priceRange, products, isCategoryFetch]);

  const categoryName = CATEGORY_LABELS[category] ?? "Sản phẩm";

  const breadcrumbItems =
    category === "all"
      ? [{ label: "Sản phẩm" }]
      : [{ label: "Sản phẩm", to: "/products" }, { label: categoryName }];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          {categoryName}
        </h1>
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Tìm thấy {filteredProducts.length} sản phẩm
        </p>
      </div>

      <div
        className={`mb-8 backdrop-blur-sm rounded-xl p-4 ${
          isDark
            ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30"
            : "bg-white/80 border border-purple-300 shadow-lg"
        }`}
      >
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <Filter
              className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-purple-600"}`}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={`rounded-lg px-4 py-2 focus:outline-none flex-1 md:flex-initial ${
                isDark
                  ? "bg-slate-900/50 border border-purple-500/30 focus:border-purple-400 text-white"
                  : "bg-white border border-purple-300 focus:border-purple-500 text-gray-900"
              }`}
            >
              <option
                value="default"
                style={{
                  background: isDark ? "#0f172a" : "#fff",
                  color: isDark ? "#fff" : "#111",
                }}
              >
                Mặc định
              </option>
              <option
                value="price-asc"
                style={{
                  background: isDark ? "#0f172a" : "#fff",
                  color: isDark ? "#fff" : "#111",
                }}
              >
                Giá thấp đến cao
              </option>
              <option
                value="price-desc"
                style={{
                  background: isDark ? "#0f172a" : "#fff",
                  color: isDark ? "#fff" : "#111",
                }}
              >
                Giá cao đến thấp
              </option>
              <option
                value="name"
                style={{
                  background: isDark ? "#0f172a" : "#fff",
                  color: isDark ? "#fff" : "#111",
                }}
              >
                Tên A-Z
              </option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? isDark
                    ? "bg-purple-500/30 text-purple-400"
                    : "bg-purple-200 text-purple-700"
                  : isDark
                    ? "text-gray-400 hover:bg-purple-500/20"
                    : "text-gray-600 hover:bg-purple-100"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? isDark
                    ? "bg-purple-500/30 text-purple-400"
                    : "bg-purple-200 text-purple-700"
                  : isDark
                    ? "text-gray-400 hover:bg-purple-500/20"
                    : "text-gray-600 hover:bg-purple-100"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isDark={isDark}
              addToCart={addToCart}
              viewMode="grid"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isDark={isDark}
              addToCart={addToCart}
              viewMode="list"
            />
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <p
            className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Không tìm thấy sản phẩm nào
          </p>
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  isDark,
  addToCart,
  viewMode,
}: {
  product: Product;
  isDark: boolean;
  addToCart: (p: Product, q: number) => void;
  viewMode: "grid" | "list";
}) {
  if (viewMode === "grid") {
    return (
      <div
        className={`backdrop-blur-sm rounded-xl overflow-hidden hover:scale-105 transition-transform cursor-pointer group ${
          isDark
            ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30"
            : "bg-white/90 border border-purple-300 shadow-lg hover:shadow-xl"
        }`}
      >
        <Link to={`/product/${product.id}`} className="block">
          <div className="aspect-video overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        </Link>
        <div className="p-4">
          <Link to={`/product/${product.id}`}>
            <h3
              className={`font-bold mb-2 line-clamp-2 min-h-[3rem] ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {product.name}
            </h3>
          </Link>
          <p
            className={`text-sm mb-3 line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {product.description}
          </p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-purple-400">
              {product.price.toLocaleString("vi-VN")}₫
            </span>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/product/${product.id}`}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-sm font-semibold hover:scale-105 transition-transform text-white text-center"
            >
              Chi tiết
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                addToCart(product, 1);
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isDark
                  ? "bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white"
                  : "bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-700"
              }`}
            >
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`backdrop-blur-sm rounded-xl overflow-hidden transition-all cursor-pointer group ${
        isDark
          ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-500/30 hover:border-purple-400/50"
          : "bg-white/90 border border-purple-300 hover:border-purple-400 shadow-lg hover:shadow-xl"
      }`}
    >
      <div className="flex flex-col md:flex-row">
        <Link
          to={`/product/${product.id}`}
          className="w-full md:w-64 h-48 md:h-auto overflow-hidden block"
        >
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </Link>
        <div className="flex-1 p-6">
          <Link to={`/product/${product.id}`}>
            <h3
              className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {product.name}
            </h3>
          </Link>
          <p
            className={`mb-4 line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {product.description}
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(product.specs)
              .slice(0, 4)
              .map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className={isDark ? "text-gray-500" : "text-gray-500"}>
                    {key}:
                  </span>
                  <span
                    className={`ml-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-purple-400">
              {product.price.toLocaleString("vi-VN")}₫
            </span>
            <div className="flex gap-2">
              <Link
                to={`/product/${product.id}`}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg font-semibold hover:scale-105 transition-transform text-white"
              >
                Xem chi tiết
              </Link>
              <button
                onClick={() => addToCart(product, 1)}
                className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                  isDark
                    ? "bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-white"
                    : "bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-700"
                }`}
              >
                Thêm vào giỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
