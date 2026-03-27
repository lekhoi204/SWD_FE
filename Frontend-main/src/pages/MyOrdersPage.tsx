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
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setViewOrder(null)} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '560px', background: 'linear-gradient(160deg, #1a1508, #0f0e17)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '20px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Chi tiết đơn hàng #{viewOrder.order_id}</h2>
              <button onClick={() => setViewOrder(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <InfoBlock label="Trạng thái">
                {(() => { const s = STATUS_STYLE[viewOrder.status] || STATUS_STYLE['Chờ xử lý']; const I = s.icon; return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: s.color, fontWeight: 600 }}><I style={{ width: 14, height: 14 }} /> {viewOrder.status}</span>; })()}
              </InfoBlock>
              <InfoBlock label="Tổng tiền"><span style={{ color: '#10b981', fontWeight: 700, fontSize: '18px' }}>{formatPrice(viewOrder.total_amount)}</span></InfoBlock>
              <InfoBlock label="Khách hàng"><span style={{ color: '#d1d5db' }}>{viewOrder.user_name || `User #${viewOrder.user_id}`}</span></InfoBlock>
              <InfoBlock label="Email"><span style={{ color: '#d1d5db' }}>{viewOrder.user_email || '—'}</span></InfoBlock>
              <InfoBlock label="Điện thoại"><span style={{ color: '#d1d5db' }}>{viewOrder.user_phone || '—'}</span></InfoBlock>
              <InfoBlock label="Ngày đặt"><span style={{ color: '#d1d5db' }}>{formatDate(viewOrder.order_date)}</span></InfoBlock>
              <InfoBlock label="Thanh toán"><span style={{ color: '#d1d5db' }}>{viewOrder.payment_method ? (PAYMENT_STYLE[viewOrder.payment_method]?.label || viewOrder.payment_method) : (PAYMENT_STYLE[viewOrder.payment_type]?.label || viewOrder.payment_type)}</span></InfoBlock>
              <InfoBlock label="Mã khuyến mãi"><span style={{ color: viewOrder.promotion_code ? '#a855f7' : '#6b7280' }}>{viewOrder.promotion_code || 'Không có'}</span></InfoBlock>
            </div>

            {viewOrder.shipping_address && (
              <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: '0 0 6px' }}>Địa chỉ giao hàng</p>
                <p style={{ fontSize: '14px', color: '#d1d5db', margin: 0, lineHeight: 1.5 }}>{viewOrder.shipping_address}</p>
              </div>
            )}

            {viewOrder.order_items && viewOrder.order_items.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', margin: '0 0 12px' }}>Sản phẩm đã đặt</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {viewOrder.order_items.map((item, idx) => {
                    const product = productsMap[item.product_id || 0];
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        {product ? (
                          <img src={product.image} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', background: '#fff' }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>
                            {item.user_build_id ? 'PC Build' : 'No Img'}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: '#fff', margin: '0 0 4px' }}>
                            {product ? product.name : (item.user_build_id ? `PC Build (ID: #${item.user_build_id})` : `Sản phẩm #${item.product_id}`)}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#9ca3af' }}>SL: <strong style={{ color: '#fff' }}>{item.quantity}</strong></span>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>{formatPrice(item.price)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', position: 'sticky', bottom: 0, left: 0, right: 0, padding: '14px 0 0', background: 'linear-gradient(180deg, rgba(15,15,17,0.05), rgba(15,15,17,1))', borderTop: '1px solid rgba(139,92,246,0.2)' }}>
              <button onClick={() => setViewOrder(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: '1px solid rgba(139,92,246,0.2)', background: 'transparent', color: '#9ca3af', cursor: 'pointer' }}>Đóng</button>
              <button onClick={() => handleReorder(viewOrder)} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', color: '#fff', cursor: 'pointer' }}>Mua lại</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: '0 0 4px' }}>{label}</p>
      <div style={{ fontSize: '14px' }}>{children}</div>
    </div>
  );
}
