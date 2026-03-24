import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useCart } from "@/context/CartContext";
import { getMyOrdersApi } from "@/api/orders";
import { getProductsApi } from "@/api/products";
import {
  Package,
  Search,
  Eye,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  RefreshCcw,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { OrderDetail, Product } from "@/types";

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: any }> = {
  "Chờ thanh toán": {
    color: "#f97316",
    bg: "rgba(249,115,22,0.12)",
    icon: CreditCard,
  },
  "Chờ duyệt": { color: "#eab308", bg: "rgba(234,179,8,0.12)", icon: Clock },
  "Chờ xử lý": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: Clock },
  "Đang xử lý": {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    icon: Package,
  },
  "Đang giao": { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", icon: Truck },
  "Đã giao": {
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    icon: CheckCircle,
  },
  "Hoàn thành": {
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    icon: CheckCircle,
  },
  "Đã hủy": { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: XCircle },
};

const STATUS_MAP: Record<string, string> = {
  PendingApproval: "Chờ duyệt",
  PendingPayment: "Chờ thanh toán",
  Pending: "Chờ xử lý",
  Processing: "Đang xử lý",
  Shipped: "Đang giao",
  Delivered: "Đã giao",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
  Canceled: "Đã hủy",
};

const normalizeStatus = (raw: string): string => STATUS_MAP[raw] ?? raw;

const PAYMENT_STYLE: Record<
  string,
  { color: string; bg: string; icon: any; label: string }
> = {
  QR_FULL: {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    icon: CreditCard,
    label: "Mã QR (toàn bộ)",
  },
  QR_INSTALLMENT: {
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    icon: CreditCard,
    label: "Mã QR (trả góp)",
  },
  COD: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
    icon: Package,
    label: "Trả sau (COD)",
  },
  "One-time": {
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.12)",
    icon: CreditCard,
    label: "Thanh toán một lần",
  },
  Installment: {
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.12)",
    icon: CreditCard,
    label: "Trả góp",
  },
};

export function MyOrdersPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { addToCart, clearCart } = useCart();
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [productsMap, setProductsMap] = useState<Record<number, Product>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewOrder, setViewOrder] = useState<OrderDetail | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersData, productsData] = await Promise.all([
          getMyOrdersApi(),
          getProductsApi({ limit: "1000" }),
        ]);
        setOrders(ordersData || []);
        const pMap: Record<number, Product> = {};
        productsData.forEach((p) => (pMap[Number(p.id)] = p));
        setProductsMap(pMap);
      } catch (error) {
        console.error("Fetch orders error:", error);
        toast.error("Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filtered = orders.filter((o) => {
    const matchesSearch = o.order_id.toString().includes(search);
    const normalizedStatus = normalizeStatus(o.status);
    const matchesStatus =
      filterStatus === "all" || normalizedStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleReorder = async (order: OrderDetail) => {
    try {
      setIsReordering(true);
      toast.loading("Đang thêm sản phẩm lại vào giỏ hàng...", {
        id: "reorder",
      });
      await clearCart();
      for (const item of order.order_items || []) {
        const product = productsMap[item.product_id || 0];
        if (product) await addToCart(product, item.quantity);
      }
      toast.success("Giỏ hàng đã sẵn sàng!", { id: "reorder" });
      navigate("/checkout");
    } catch (error) {
      toast.error("Lỗi khi mua lại đơn hàng.", { id: "reorder" });
    } finally {
      setIsReordering(false);
    }
  };

  // Stats calculation
  const pendingCount = orders.filter((o) =>
    ["Chờ xử lý", "Chờ duyệt", "Chờ thanh toán"].includes(
      normalizeStatus(o.status),
    ),
  ).length;
  const completedCount = orders.filter((o) =>
    ["Đã giao", "Hoàn thành"].includes(normalizeStatus(o.status)),
  ).length;
  const totalSpent = orders.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a051d",
        color: "#fff",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <Breadcrumb
          items={[
            { label: "Tài khoản", to: "/profile" },
            { label: "Đơn hàng của tôi" },
          ]}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "32px 0 24px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Đơn hàng của tôi
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px" }}>
              Xem lịch sử mua sắm và trạng thái vận chuyển
            </p>
          </div>
        </div>

        {/* Stats Summary like Manager Page */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Tổng đơn hàng",
              value: orders.length,
              color: "#7c3aed",
              icon: Package,
            },
            {
              label: "Chờ xử lý",
              value: pendingCount,
              color: "#eab308",
              icon: Clock,
            },
            {
              label: "Hoàn thành",
              value: completedCount,
              color: "#10b981",
              icon: CheckCircle,
            },
            {
              label: "Tổng chi tiêu",
              value: formatPrice(totalSpent),
              color: "#3b82f6",
              icon: DollarSign,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "20px",
                borderRadius: "20px",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${s.color}20`,
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  padding: "10px",
                  borderRadius: "12px",
                  background: `${s.color}15`,
                  color: s.color,
                }}
              >
                <s.icon size={24} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    margin: "0 0 2px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: s.color,
                    margin: 0,
                  }}
                >
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: 18,
                height: 18,
                color: "#9ca3af",
              }}
            />
            <input
              placeholder="Tìm theo mã đơn hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: "44px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(139,92,246,0.15)",
                borderRadius: "12px",
                padding: "0 16px 0 40px",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              width: "auto",
              minWidth: "180px",
              height: "44px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(139,92,246,0.15)",
              borderRadius: "12px",
              padding: "0 12px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all" style={{ background: "#0a051d" }}>
              Tất cả trạng thái
            </option>
            {Object.keys(STATUS_STYLE).map((k) => (
              <option key={k} value={k} style={{ background: "#0a051d" }}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {/* Table View like Manager Page */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(139,92,246,0.1)",
            borderRadius: "20px",
            overflow: "hidden shadow-2xl shadow-black/50",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(139,92,246,0.03)",
                  }}
                >
                  {[
                    "Mã đơn",
                    "Ngày đặt",
                    "Tổng tiền",
                    "Thanh toán",
                    "Trạng thái",
                    "Thao tác",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "60px", textAlign: "center" }}
                    >
                      <RefreshCcw className="animate-spin mx-auto text-purple-500" />
                    </td>
                  </tr>
                ) : (
                  filtered.map((o) => {
                    const normalizedStatus = normalizeStatus(o.status);
                    const st =
                      STATUS_STYLE[normalizedStatus] ||
                      STATUS_STYLE["Chờ xử lý"];
                    const StIcon = st.icon;
                    const met = o.payment_method || o.payment_type || "COD";
                    const pt = PAYMENT_STYLE[met] || {
                      color: "#9ca3af",
                      bg: "rgba(255,255,255,0.05)",
                      icon: CreditCard,
                      label: met,
                    };
                    const PtIcon = pt.icon;

                    return (
                      <tr
                        key={o.order_id}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          transition: "background 0.2s cursor-default",
                        }}
                      >
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "14px",
                            color: "#a78bfa",
                            fontWeight: 700,
                          }}
                        >
                          #{o.order_id}
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "13px",
                            color: "#d1d5db",
                          }}
                        >
                          {formatDate(o.order_date).split(",")[0]}
                        </td>
                        <td
                          style={{
                            padding: "16px",
                            fontSize: "14px",
                            color: "#10b981",
                            fontWeight: 600,
                          }}
                        >
                          {formatPrice(o.total_amount)}
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: pt.color,
                              background: pt.bg,
                            }}
                          >
                            <PtIcon style={{ width: 14, height: 14 }} />{" "}
                            {pt.label}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: st.color,
                              background: st.bg,
                              border: `1px solid ${st.color}20`,
                            }}
                          >
                            <StIcon style={{ width: 14, height: 14 }} />{" "}
                            {normalizedStatus}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => setViewOrder(o)}
                              title="Xem chi tiết"
                              style={{
                                padding: "8px",
                                borderRadius: "10px",
                                border: "none",
                                cursor: "pointer",
                                background: "rgba(139,92,246,0.1)",
                                color: "#8b5cf6",
                                display: "flex",
                              }}
                            >
                              <Eye style={{ width: 16, height: 16 }} />
                            </button>
                            <button
                              onClick={() => handleReorder(o)}
                              title="Mua lại đơn này"
                              style={{
                                padding: "8px",
                                borderRadius: "10px",
                                border: "none",
                                cursor: "pointer",
                                background: "rgba(16,185,129,0.1)",
                                color: "#10b981",
                                display: "flex",
                              }}
                            >
                              <RefreshCcw
                                style={{ width: 16, height: 16 }}
                                className={isReordering ? "animate-spin" : ""}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: "14px",
                      }}
                    >
                      Không có dữ liệu đơn hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal like Manager Page */}
      {viewOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setViewOrder(null)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-purple-950 to-slate-950 border border-purple-500/30 rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/50 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
            <div className="flex justify-between items-start gap-4 mb-6 md:mb-8 sticky top-0 bg-gradient-to-br from-purple-950 to-slate-950 -mx-6 md:-mx-8 px-6 md:px-8 py-4 md:py-6 border-b border-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/15 rounded-lg text-purple-300">
                  <Package size={20} />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white">
                  Chi tiết đơn hàng #{viewOrder.order_id}
                </h2>
              </div>
              <button
                onClick={() => setViewOrder(null)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 cursor-pointer flex p-2 rounded-lg flex-shrink-0 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Status & Total */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 md:p-5 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-all">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
                  Trạng thái
                </p>
                {(() => {
                  const ns = normalizeStatus(viewOrder.status);
                  const s = STATUS_STYLE[ns] || STATUS_STYLE["Chờ xử lý"];
                  const I = s.icon;
                  return (
                    <span
                      className="flex items-center gap-2 font-bold text-base"
                      style={{ color: s.color }}
                    >
                      <I size={16} /> {ns}
                    </span>
                  );
                })()}
              </div>
              <div className="p-4 md:p-5 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-all">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">
                  Tổng thanh toán
                </p>
                <span className="text-emerald-400 font-black text-lg md:text-xl">
                  {formatPrice(viewOrder.total_amount)}
                </span>
              </div>
            </div>

            {/* Order Info Grid */}
            <div className="mb-6 p-5 rounded-3xl bg-white/2 border border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">
                    Ngày đặt
                  </p>
                  <p className="text-gray-300 text-sm font-medium">
                    {formatDate(viewOrder.order_date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">
                    Phương thức thanh toán
                  </p>
                  <p className="text-gray-300 text-sm font-medium">
                    {PAYMENT_STYLE[
                      viewOrder.payment_method || viewOrder.payment_type
                    ]?.label ||
                      viewOrder.payment_method ||
                      viewOrder.payment_type ||
                      "COD"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 font-bold uppercase tracking-wider">
                  Địa chỉ giao hàng
                </p>
                <p className="text-gray-300 text-sm leading-relaxed flex gap-2">
                  <MapPin
                    size={14}
                    className="flex-shrink-0 mt-0.5 text-purple-400"
                  />{" "}
                  {viewOrder.shipping_address || "N/A"}
                </p>
              </div>
            </div>

            {/* Products */}
            <div className="mb-8">
              <p className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">
                Sản phẩm ({viewOrder.order_items?.length || 0})
              </p>
              <div className="flex flex-col gap-3">
                {viewOrder.order_items?.map((item, idx) => {
                  const product = productsMap[item.product_id || 0];
                  return (
                    <div
                      key={idx}
                      className="flex gap-4 p-3 md:p-4 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-purple-500/20 transition-all"
                    >
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-white p-1 flex-shrink-0 flex items-center justify-center">
                        {product?.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package size={24} className="text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm md:text-base font-bold text-white truncate">
                          {product?.name || `Sản phẩm #${item.product_id}`}
                        </p>
                        <div className="flex justify-between items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs md:text-sm text-gray-400 font-semibold">
                            SL:{" "}
                            <span className="text-gray-300">
                              {item.quantity}
                            </span>
                          </span>
                          <span className="text-sm md:text-base font-bold text-emerald-400">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 sticky bottom-0 -mx-6 md:-mx-8 px-6 md:px-8 py-4 md:py-6 bg-gradient-to-t from-slate-950 to-transparent border-t border-purple-500/10">
              <button
                onClick={() => setViewOrder(null)}
                className="flex-1 py-3 rounded-xl text-sm md:text-base font-bold border border-white/10 bg-transparent hover:bg-white/5 text-gray-400 hover:text-gray-300 cursor-pointer transition-all"
              >
                Đóng
              </button>
              <button
                onClick={() => handleReorder(viewOrder)}
                className="flex-1 py-3 rounded-xl text-sm md:text-base font-bold border-none bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/50"
              >
                <RefreshCcw
                  size={18}
                  className={isReordering ? "animate-spin" : ""}
                />
                Mua lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
