import { useState, useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { getProductByIdApi } from "@/api/products";
import {
  getSpecsByProductIdApi,
  type Specification,
} from "@/api/specifications";
import * as SpecificationsV2Api from "@/api/specificationsV2";
import { CATEGORY_LABELS } from "@/constants/categories";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Product, InstallmentPlan, ProductCategory } from "@/types";

/** Thanh toán / trả góp (cùng logic với Checkout — thêm gói trả một lần) */
const PAYMENT_PLANS: InstallmentPlan[] = [
  { id: "full", name: "Thanh toán một lần", months: 0, interest: 0 },
  { id: "3-months", name: "Trả góp 3 tháng", months: 3, interest: 0 },
  { id: "6-months", name: "Trả góp 6 tháng", months: 6, interest: 0.48 },
  { id: "9-months", name: "Trả góp 9 tháng", months: 9, interest: 0.84 },
  { id: "12-months", name: "Trả góp 12 tháng", months: 12, interest: 1.2 },
];

/**
 * Map spec key (backend trả) → label hiển thị tiếng Việt
 * Theo bảng quy chuẩn của dự án.
 */
const SPEC_LABELS: Record<string, string> = {
  // ── CPU (socket → translateSpecKey theo category) ─────────────────
  cores: "Số nhân",
  threads: "Số luồng",
  tdp: "Mức tiêu thụ điện (W)",
  boost_clock: "Xung nhịp tối đa (GHz)",
  generation: "Thế hệ",
  series: "Dòng sản phẩm",
  base_clock: "Xung cơ bản (GHz)",
  cache: "Bộ nhớ đệm",
  cache_mb: "Bộ nhớ đệm (MB)",

  // ── GPU ──────────────────────────────────────────────────────────
  memory_gb: "Dung lượng VRAM (GB)",
  memory_type: "Loại bộ nhớ",
  length_mm: "Chiều dài card (mm)",
  power_pin: "Đầu cắm nguồn",
  ray_tracing: "Hỗ trợ Ray Tracing",

  // ── Mainboard (socket / form_factor / type xử lý theo category trong translateSpecKey) ──
  chipset: "Chipset",
  ram_type: "Loại RAM hỗ trợ",
  ram_slots: "Số khe RAM",
  m2_slots: "Số khe M.2",

  // ── RAM ──────────────────────────────────────────────────────────
  capacity_gb: "Dung lượng (GB)",
  speed_mhz: "Tốc độ (MHz)",
  kit_size: "Bộ (1 thanh / 2 thanh)",
  latency: "Độ trễ (CL)",

  // ── PSU ──────────────────────────────────────────────────────────
  wattage: "Công suất (W)",
  certification: "Chứng chỉ hiệu suất",
  modular: "Kiểu dây nguồn",

  // ── Case ──────────────────────────────────────────────────────────
  max_gpu_length_mm: "Chiều dài GPU tối đa (mm)",
  max_cooler_height_mm: "Chiều cao tản nhiệt tối đa (mm)",
  fans_included: "Số quạt đi kèm",

  // ── Cooler ───────────────────────────────────────────────────────
  supported_sockets: "Chân cắm hỗ trợ",
  max_tdp: "TDP tối đa hỗ trợ (W)",
  height_mm: "Chiều cao tản nhiệt (mm)",

  // ── Storage ───────────────────────────────────────────────────────
  capacity: "Dung lượng",
  interface_type: "Giao diện",
  read_speed: "Tốc độ đọc",
  write_speed: "Tốc độ ghi",

  // ── Monitor ───────────────────────────────────────────────────────
  screen_size: "Kích thước màn hình",
  resolution: "Độ phân giải",
  panel_type: "Loại tấm nền",
  refresh_rate: "Tần số quét (Hz)",
  response_time: "Thời gian phản hồi (ms)",
  brightness: "Độ sáng (nit)",
  hdr: "Hỗ trợ HDR",
  adaptive_sync: "Công nghệ đồng bộ",

  // ── Keyboard / Mouse ─────────────────────────────────────────────
  connectivity: "Kết nối",
  switch_type: "Loại switch",
  dpi: "DPI",
  battery: "Pin",
  weight: "Trọng lượng (g)",

  // ── Laptop ────────────────────────────────────────────────────────
  os: "Hệ điều hành",
  display: "Màn hình",
  battery_life: "Thời lượng pin",
  thickness: "Độ dày (mm)",
  weight_kg: "Trọng lượng (kg)",
};

/** Chuẩn hóa key từ backend (snake_case, có thể có khoảng trắng / hoa thường) */
function normalizeSpecKey(key: string): string {
  return key
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_");
}

/** Dịch spec key sang label tiếng Việt; category phân biệt key trùng (socket, type, form_factor) */
function translateSpecKey(key: string, productCategory?: ProductCategory): string {
  const k = normalizeSpecKey(key);
  const cat = productCategory?.toLowerCase() as ProductCategory | undefined;

  if (k === "socket") {
    if (cat === "motherboard") return "Chân cắm CPU";
    return "Chân cắm";
  }
  if (k === "form_factor") {
    if (cat === "case") return "Kích thước case";
    if (cat === "motherboard") return "Kích thước bo mạch";
    return "Kích thước";
  }
  if (k === "type") {
    if (cat === "cooler" || cat === "cooling") return "Loại tản nhiệt (Air/AIO)";
    if (cat === "ram") return "Loại RAM (DDR4/DDR5)";
    return "Loại";
  }

  return SPEC_LABELS[k] ?? key;
}

/** Format giá trị: true/false → Có/Không, chuẩn hóa boolean; guard null/undefined */
function formatSpecValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }
  const v = String(value).trim().toLowerCase();
  if (v === "true" || v === "yes" || v === "1") return "Có";
  if (v === "false" || v === "no" || v === "0") return "Không";
  return String(value);
}

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
        const data = await getProductByIdApi(id);

        // Ưu tiên legacy API (cùng endpoint với ManagerProductsPage → chắc chắn hoạt động)
        let specs: Specification[] = [];
        try {
          const legacySpecs = await getSpecsByProductIdApi(id);
          if (Array.isArray(legacySpecs) && legacySpecs.length > 0) {
            // Legacy trả spec_name đúng key backend (socket, cores…) → map sang tiếng Việt
            specs = legacySpecs.map((s) => ({
              ...s,
              spec_name: translateSpecKey(String(s.spec_name), data.category),
              spec_value: formatSpecValue(s.spec_value as unknown),
            }));
          }
        } catch (err) {
          console.warn("[ProductDetail] Legacy spec fetch failed:", err);
        }

        // V2 JSON endpoint làm fallback — thường trả object thay vì array nên cần xử lý cẩn thận
        if (specs.length === 0) {
          try {
            const jsonSpecs = await SpecificationsV2Api.getJsonSpecsApi(id as string);
            console.debug("[ProductDetail] V2 specs raw response:", jsonSpecs);

            if (Array.isArray(jsonSpecs)) {
              specs = jsonSpecs.map((s: any, idx: number) => {
                try {
                  if (s.spec_name && s.spec_value)
                    return {
                      spec_id: s.spec_id ?? idx,
                      product_id: s.product_id ?? Number(id),
                      spec_name: translateSpecKey(String(s.spec_name), data.category),
                      spec_value: formatSpecValue(s.spec_value),
                    } as Specification;
                  const rawKey = String(s.name ?? s.key ?? `spec_${idx}`);
                  return {
                    spec_id: s.spec_id ?? idx,
                    product_id: s.product_id ?? Number(id),
                    spec_name: translateSpecKey(rawKey, data.category),
                    spec_value: formatSpecValue(s.value),
                  } as Specification;
                } catch (e) {
                  return {
                    spec_id: idx,
                    product_id: Number(id),
                    spec_name: String(s.spec_name ?? s.name ?? s.key ?? `spec_${idx}`),
                    spec_value: String(s.spec_value ?? s.value ?? ""),
                  } as Specification;
                }
              });
            } else if (jsonSpecs && typeof jsonSpecs === "object") {
              // Chuẩn backend V2: { product_id, specs: { ... } } — lấy phần specs nếu có
              const specRecord =
                (jsonSpecs as { specs?: Record<string, unknown> }).specs &&
                typeof (jsonSpecs as { specs?: Record<string, unknown> }).specs ===
                  "object" &&
                !Array.isArray((jsonSpecs as { specs?: unknown }).specs)
                  ? (jsonSpecs as { specs: Record<string, unknown> }).specs
                  : (jsonSpecs as Record<string, unknown>);
              // Bỏ qua product_id / metadata không phải map spec
              const keys = Object.keys(specRecord).filter(
                (k) => k !== "product_id" && k !== "specs",
              );
              specs = keys.map((k, idx) => {
                try {
                  return {
                    spec_id: idx + 1,
                    product_id: Number(id),
                    spec_name: translateSpecKey(k, data.category),
                    spec_value: formatSpecValue((specRecord as any)[k]),
                  };
                } catch (e) {
                  return {
                    spec_id: idx + 1,
                    product_id: Number(id),
                    spec_name: k,
                    spec_value: String((specRecord as any)[k] ?? ""),
                  };
                }
              });
            }
          } catch (err) {
            console.error("[ProductDetail] V2 spec fetch failed:", err);
          }
        }

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div
          className={`rounded-xl flex items-center justify-center p-3 overflow-hidden h-[240px] max-w-[320px] ${isDark ? "bg-white border border-gray-100" : "bg-white border border-gray-200 shadow-lg"}`}
        >
          <img
            src={product.image}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1
              className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? "text-white" : "text-black"}`}
            >
              {product.name}
            </h1>
            <div className="flex items-baseline gap-4 mb-4">
              <span className="text-4xl font-bold text-purple-500">
                {product.price.toLocaleString("vi-VN")}₫
              </span>
              {product.stock > 0 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Còn hàng ({product.stock})
                </span>
              ) : (
                <span className="text-red-500">Hết hàng</span>
              )}
            </div>
            <p
              className={`leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              {product.description}
            </p>
          </div>

          {specifications.length > 0 && (
            <div
              className={`backdrop-blur-sm rounded-xl border p-6 ${isDark ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30" : "bg-white/80 border-purple-300 shadow-lg"}`}
            >
              <h3
                className={`text-xl font-bold mb-4 ${isDark ? "text-purple-400" : "text-purple-600"}`}
              >
                Thông số kỹ thuật
              </h3>
              <div className="space-y-2">
                {specifications.map((spec) => (
                  <div
                    key={spec.spec_id}
                    className={`flex justify-between items-center py-2 border-b last:border-b-0 ${isDark ? "border-purple-500/20" : "border-purple-100"}`}
                  >
                    <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {toViLabel(spec.spec_name)}
                    </span>
                    <span className={`text-sm font-semibold text-right max-w-[60%] ml-4 ${isDark ? "text-white" : "text-gray-800"}`}>
                      {String(spec.spec_value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className={`backdrop-blur-sm rounded-xl border p-6 ${isDark ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30" : "bg-white/80 border-purple-300 shadow-lg"}`}
          >
            <h3
              className={`text-xl font-bold mb-4 ${isDark ? "text-purple-400" : "text-purple-600"}`}
            >
              Phương thức thanh toán
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPaymentPlan(plan.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPaymentPlan === plan.id
                      ? `${isDark ? "border-purple-400 bg-purple-500/20" : "border-purple-500 bg-purple-50"}`
                      : `${isDark ? "border-purple-500/30 bg-purple-900/20 hover:border-purple-400/50" : "border-purple-200 hover:border-purple-400/50"}`
                  }`}
                >
                  <div
                    className={`font-semibold mb-1 ${isDark ? "text-white" : "text-black"}`}
                  >
                    {plan.name}
                  </div>
                  {plan.months > 0 && (
                    <div
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {plan.interest > 0
                        ? `Lãi suất ${plan.interest}%`
                        : "Lãi suất 0%"}
                    </div>
                  )}
                </button>
              ))}
            </div>

            {selectedPlan.months > 0 && (
              <div
                className={`mt-4 p-4 rounded-lg border ${isDark ? "bg-blue-500/20 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}
              >
                <div
                  className={`text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Trả góp {selectedPlan.months} tháng
                  {selectedPlan.interest > 0 &&
                    ` (Lãi suất ${selectedPlan.interest}%)`}
                </div>
                <div
                  className={`text-2xl font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}
                >
                  {monthlyPayment.toLocaleString("vi-VN")}₫/tháng
                </div>
                {selectedPlan.interest > 0 && (
                  <div
                    className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Tổng thanh toán: {totalWithInterest.toLocaleString("vi-VN")}
                    ₫
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className={`backdrop-blur-sm rounded-xl border p-6 ${isDark ? "bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-500/30" : "bg-white/80 border-purple-300 shadow-lg"}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <span
                className={`font-semibold ${isDark ? "text-white" : "text-black"}`}
              >
                Số lượng:
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className={`w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center hover:bg-purple-500/50 transition-colors ${isDark ? "text-white" : "text-black"}`}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span
                  className={`text-2xl font-bold w-12 text-center ${isDark ? "text-white" : "text-black"}`}
                >
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className={`w-10 h-10 bg-purple-500/30 rounded-lg flex items-center justify-center hover:bg-purple-500/50 transition-colors ${isDark ? "text-white" : "text-black"}`}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className={`mb-4 p-4 rounded-lg ${isDark ? "bg-slate-900/50" : "bg-gray-100"}`}
            >
              <div
                className={`flex justify-between mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                <span>Tạm tính:</span>
                <span className="font-semibold">
                  {totalPrice.toLocaleString("vi-VN")}₫
                </span>
              </div>
              {selectedPlan.interest > 0 && (
                <div
                  className={`flex justify-between mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  <span>Lãi suất ({selectedPlan.interest}%):</span>
                  <span className="font-semibold">
                    {(totalWithInterest - totalPrice).toLocaleString("vi-VN")}₫
                  </span>
                </div>
              )}
              <div
                className={`flex justify-between text-xl font-bold pt-2 border-t ${isDark ? "text-purple-400 border-purple-500/30" : "text-purple-600 border-purple-200"}`}
              >
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
