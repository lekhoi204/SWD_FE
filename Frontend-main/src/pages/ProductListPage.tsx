import { useState, useMemo, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Filter, Grid, List, Search } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import {
  getProductsApi,
  getProductsByCategoryIdApi,
  searchProductsApi,
} from "@/api/products";
import { getCategoriesApi } from "@/api/categories";
import { CATEGORY_LABELS } from "@/constants/categories";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Product } from "@/types";

export function ProductListPage() {
  const { category: categoryParam } = useParams<{ category?: string }>();
  const category = categoryParam ?? "all";
  const { isDark } = useTheme();
  const { addToCart } = useCart();
  const navigate = useNavigate();
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
  const [categories, setCategories] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // Helper để normalize category name cho URL slug
  const getCategorySlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setIsCategoryFetch(false);

        if (debouncedSearch) {
          try {
            const categoryList = await getCategoriesApi();
            if (mounted) setCategories(categoryList);
            const data = await searchProductsApi(debouncedSearch);
            if (mounted) {
              setProducts(data);
              setIsCategoryFetch(true);
            }
          } catch (err) {
            console.error("Product search failed:", err);
            if (mounted) setProducts([]);
          } finally {
            if (mounted) setLoading(false);
          }
          return;
        }

        // If category is provided (not 'all'), try to resolve backend category id
        if (category !== "all") {
          try {
            const categoryList = await getCategoriesApi();
            if (mounted) setCategories(categoryList);
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

            /**
             * Khớp danh mục với URL/slug.
             * Tránh lỗi: slug "tan-nhiet-cpu" → "tannhietcpu" lại khớp nhầm "CPU" vì
             * `tannhietcpu`.includes(`cpu`) === true. Chỉ dùng `targetNorm.includes(nameNorm)`
             * khi tên danh mục đủ dài (>= 6 ký tự sau normalize), hoặc ưu tiên khớp dài trước.
             */
            const MIN_REVERSE_SUBSTRING_LEN = 6;
            const byLengthDesc = [...categoryList].sort(
              (a, b) =>
                normalize(String(b?.name ?? "")).length -
                normalize(String(a?.name ?? "")).length,
            );

            let matched = byLengthDesc.find((c) => {
              if (!c || !c.name) return false;
              const nameNorm = normalize(String(c.name));
              // Exact slug match — skip reverse substring check to prevent
              // "tan-nhiet-cpu" / "tannhietcpu" from matching "cpu"
              if (nameNorm === targetNorm || nameNorm === keyNorm) return true;
              if (targetNorm.length >= 3 && nameNorm.includes(targetNorm))
                return true;
              if (
                targetNorm.length >= MIN_REVERSE_SUBSTRING_LEN &&
                targetNorm.includes(nameNorm)
              )
                return true;
              return false;
            });

            console.debug("Fetched categories for matching:", categoryList);
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
              // Không tìm được category trong danh sách → gửi category slug lên backend filter
              const data = await getProductsApi({ category });
              if (mounted) setProducts(data);
            }
          } catch (err) {
            // Lỗi → vẫn gửi category lên backend filter
            console.error(
              "Category lookup failed, falling back to backend filter",
              err,
            );
            const data = await getProductsApi({ category });
            if (mounted) setProducts(data);
          }
        } else {
          const categoryList = await getCategoriesApi();
          if (mounted) setCategories(categoryList);
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
  }, [category, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, debouncedSearch]);

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

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const productsOnCurrentPage = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="flex w-full min-w-0 flex-col gap-4 md:flex-1">
            <div
              className={`flex w-full min-h-[48px] items-center gap-3 rounded-xl border px-4 ${
                isDark
                  ? "bg-slate-900/50 border-purple-500/30 focus-within:border-purple-400 text-white"
                  : "bg-white border-purple-300 focus-within:border-purple-500 text-gray-900"
              }`}
            >
              <Search
                aria-hidden
                className={`shrink-0 size-5 pointer-events-none ${
                  isDark ? "text-purple-400" : "text-purple-600"
                }`}
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên sản phẩm..."
                autoComplete="off"
                className={`min-h-[44px] min-w-0 flex-1 border-0 bg-transparent py-3 text-base leading-normal focus:outline-none focus:ring-0 ${
                  isDark
                    ? "text-white placeholder:text-gray-500"
                    : "text-gray-900 placeholder:text-gray-400"
                }`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
            <Filter
              className={`w-5 h-5 shrink-0 ${isDark ? "text-purple-400" : "text-purple-600"}`}
            />
            <select
              value={category}
              onChange={(e) => {
                const slug = e.target.value;
                if (slug === "all") {
                  navigate("/products");
                } else {
                  navigate(`/products/${slug}`);
                }
              }}
              className={`rounded-lg px-4 py-2 focus:outline-none ${
                isDark
                  ? "bg-slate-900/50 border border-purple-500/30 focus:border-purple-400 text-white"
                  : "bg-white border border-purple-300 focus:border-purple-500 text-gray-900"
              }`}
            >
              <option
                value="all"
                style={{
                  background: isDark ? "#0f172a" : "#fff",
                  color: isDark ? "#fff" : "#111",
                }}
              >
                Tất cả danh mục
              </option>
              {categories.map((cat) => (
                <option
                  key={cat.category_id}
                  value={getCategorySlug(cat.name)}
                  style={{
                    background: isDark ? "#0f172a" : "#fff",
                    color: isDark ? "#fff" : "#111",
                  }}
                >
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className={`rounded-lg px-4 py-2 focus:outline-none ${
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
          </div>
          <div className="flex shrink-0 items-center gap-2 md:min-h-[48px]">
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
          {productsOnCurrentPage.map((product) => (
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
          {productsOnCurrentPage.map((product) => (
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

      {totalPages > 1 && (
        <div
          className={`flex flex-wrap items-center justify-center gap-2 mt-12 p-6 rounded-xl transition-colors ${
            isDark
              ? "bg-gradient-to-r from-slate-800 to-slate-900"
              : "bg-gradient-to-r from-purple-50 to-blue-50"
          }`}
        >
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentPage === 1
                ? isDark
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                : isDark
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 shadow-lg"
                  : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:scale-105 shadow-lg"
            }`}
          >
            ← Trước
          </button>

          <div className="flex flex-wrap gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  page === currentPage
                    ? isDark
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105"
                      : "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105"
                    : isDark
                      ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentPage === totalPages
                ? isDark
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                : isDark
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 shadow-lg"
                  : "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:scale-105 shadow-lg"
            }`}
          >
            Tiếp →
          </button>

          <div
            className={`ml-4 text-sm font-medium ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Trang {currentPage} / {totalPages}
          </div>
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
          <div className="w-full h-48 bg-white overflow-hidden flex items-center justify-center border-b border-gray-100/10">
            <img
              src={product.image}
              alt={product.name}
              className="mx-auto p-4 object-contain max-h-[160px] w-auto group-hover:scale-105 transition-transform duration-300"
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
          className="w-full md:w-64 h-48 md:h-auto bg-white overflow-hidden flex items-center justify-center border-r border-gray-100/10 block shrink-0"
        >
          <img
            src={product.image}
            alt={product.name}
            className="mx-auto p-4 object-contain max-h-[160px] w-auto group-hover:scale-105 transition-transform duration-300"
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
