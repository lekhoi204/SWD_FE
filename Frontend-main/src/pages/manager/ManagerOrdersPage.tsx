import { useState, useEffect } from 'react';
import { Search, X, Eye, Trash2, Pencil, Package, Clock, CheckCircle, XCircle, Truck, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { getOrdersApi, updateOrderApi, deleteOrderApi } from '@/api/orders';
import { getProductsApi } from '@/api/products';
import { adminCompleteOrderPayment } from '@/api/payments';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { OrderDetail, Product } from '@/types';

const ACCENT = '#f59e0b';
const ACCENT_RGB = '245,158,11';
const ACCENT_BG = `rgba(${ACCENT_RGB},0.12)`;

const ORDER_STATUSES = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Chờ thanh toán', label: 'Chờ thanh toán' },
  { value: 'Chờ duyệt', label: 'Chờ duyệt' },
  { value: 'Chờ xử lý', label: 'Chờ xử lý' },
  { value: 'Đang xử lý', label: 'Đang xử lý' },
  { value: 'Đang giao', label: 'Đang giao' },
  { value: 'Đã giao', label: 'Đã giao' },
  { value: 'Hoàn thành', label: 'Hoàn thành' },
  { value: 'Đã hủy', label: 'Đã hủy' },
];

const STATUS_STYLE: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  'Chờ thanh toán': { color: '#f97316', bg: 'rgba(249,115,22,0.12)', icon: CreditCard },
  'Chờ duyệt':      { color: '#eab308', bg: 'rgba(234,179,8,0.12)',  icon: Clock },
  'Chờ xử lý':     { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  'Đang xử lý':    { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: Package },
  'Đang giao':      { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: Truck },
  'Đã giao':        { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  'Hoàn thành':     { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  'Đã hủy':         { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle },
};

const PAYMENT_STYLE: Record<string, { color: string; bg: string; icon: typeof CreditCard; label: string }> = {
  'QR_FULL':       { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: CreditCard, label: 'Mã QR (toàn bộ)' },
  'QR_INSTALLMENT':{ color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: CreditCard, label: 'Mã QR (trả góp)' },
  'COD':           { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: Banknote,   label: 'Trả sau (COD)' },
  'One-time':      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  icon: CreditCard, label: 'Một lần' },
  'Installment':   { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: CreditCard, label: 'Trả góp' },
};

const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ';
const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return d; }
};

/** Map English → Vietnamese để frontend luôn hiển thị đúng dù backend trả gì */
const STATUS_MAP: Record<string, string> = {
  PendingApproval: 'Chờ duyệt',
  PendingPayment: 'Chờ thanh toán',
  Pending:        'Chờ xử lý',
  Processing:     'Đang xử lý',
  Shipped:        'Đang giao',
  Delivered:      'Đã giao',
  Completed:      'Hoàn thành',
  Cancelled:      'Đã hủy',
};

const REVERSE_STATUS_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_MAP).map(([en, vi]) => [vi, en])
);

function normalizeStatus(raw: string): string {
  return STATUS_MAP[raw] ?? raw;
}

/** Chuyển label tiếng Việt → English trước khi gửi lên API */
function toApiStatus(vnLabel: string): string {
  return REVERSE_STATUS_MAP[vnLabel] ?? vnLabel;
}

/** Backend có thể trả payment_id, paymentId hoặc payment: { id, payment_id } */
function getPaymentId(o: OrderDetail): number | null {
  const r = o as unknown as Record<string, unknown>;
  const nested = r.payment as Record<string, unknown> | undefined;
  const raw =
    r.payment_id ??
    r.paymentId ??
    nested?.payment_id ??
    nested?.id;
  if (raw == null || raw === '') return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function isQrPaymentOrder(o: OrderDetail): boolean {
  const m = o.payment_method || (o as unknown as { paymentMethod?: string }).paymentMethod;
  return m === 'QR_FULL' || m === 'QR_INSTALLMENT';
}

/** Hiện nút xác nhận thanh toán: đơn QR đã thanh toán (Chờ duyệt), không hiện khi Chờ thanh toán */
function shouldShowConfirmPaymentButton(o: OrderDetail): boolean {
  if (!isQrPaymentOrder(o)) return false;
  const terminal = new Set([
    'Chờ thanh toán', 'Hoàn thành', 'Đã hủy', 'Đã giao',
  ]);
  if (terminal.has(o.status)) return false;
  const ps = String(o.payment_status || '').toLowerCase();
  if (ps === 'completed' || ps === 'paid' || ps === 'success') return false;
  return true;
}

function normalizeOrderFromApi(row: OrderDetail): OrderDetail {
  const pid = getPaymentId(row);
  const r = row as unknown as Record<string, unknown>;
  return {
    ...row,
    payment_id: pid ?? row.payment_id ?? null,
    payment_method: (row.payment_method || r.paymentMethod) as string | null | undefined,
    payment_status: (row.payment_status || r.paymentStatus) as string | null | undefined,
  };
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: `1px solid rgba(${ACCENT_RGB},0.2)`,
  background: 'rgba(255,255,255,0.05)',
  color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
};

export function ManagerOrdersPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [productsMap, setProductsMap] = useState<Record<number, Product>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewOrder, setViewOrder] = useState<OrderDetail | null>(null);
  const [editOrder, setEditOrder] = useState<OrderDetail | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrderDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [completingOrderId, setCompletingOrderId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, productsData] = await Promise.all([getOrdersApi(), getProductsApi()]);
      setOrders(ordersData.map((o) => ({ ...normalizeOrderFromApi(o), status: normalizeStatus(o.status) })));
      const pMap: Record<number, Product> = {};
      productsData.forEach(p => pMap[Number(p.id)] = p);
      setProductsMap(pMap);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải dữ liệu');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = orders.filter((o) => {
    const searchLower = search.toLowerCase();
    const matchSearch = !search
      || String(o.order_id).includes(search)
      || (o.user_name || '').toLowerCase().includes(searchLower)
      || (o.user_email || '').toLowerCase().includes(searchLower)
      || (o.user_phone || '').toLowerCase().includes(searchLower);
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleUpdate = async () => {
    if (!editOrder) return;
    setSaving(true);
    try {
      await updateOrderApi(String(editOrder.order_id), {
        status: toApiStatus(editStatus),
        shipping_address: editAddress || undefined,
      } as any);
      toast.success('Cập nhật đơn hàng thành công');
      setEditOrder(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Cập nhật thất bại');
    } finally { setSaving(false); }
  };

  const handleConfirmPayment = async (orderId: number) => {
    setCompletingOrderId(orderId);
    try {
      await adminCompleteOrderPayment(orderId);
      toast.success(`Đã xác nhận thanh toán cho đơn #${orderId}.`);
      setViewOrder(null);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Xác nhận thanh toán thất bại.');
    } finally {
      setCompletingOrderId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteOrderApi(String(deleteTarget.order_id));
      toast.success('Xóa đơn hàng thành công');
      setDeleteTarget(null);
      await fetchData();
    } catch (err: any) {
      const msg = err?.message || err?.data?.message || err?.data?.error || 'Xóa thất bại';
      const hint = err?.status === 500 ? ' (Backend có thể chặn xóa do ràng buộc dữ liệu)' : '';
      toast.error(String(msg) + hint);
    } finally { setDeleting(false); }
  };

  const totalRevenue = orders.filter(o => o.status !== 'Đã hủy').reduce((sum, o) => sum + o.total_amount, 0);
  const pendingCount = orders.filter(o => ['Chờ xử lý', 'Chờ duyệt', 'Chờ thanh toán'].includes(o.status)).length;
  const completedCount = orders.filter(o => ['Hoàn thành', 'Đã giao'].includes(o.status)).length;

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>Đang tải...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Quản lý đơn hàng</h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>{orders.length} đơn hàng</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Tổng đơn hàng', value: orders.length, color: ACCENT },
          { label: 'Chờ xử lý', value: pendingCount, color: '#eab308' },
          { label: 'Hoàn thành', value: completedCount, color: '#10b981' },
          { label: 'Doanh thu', value: formatPrice(totalRevenue), color: '#3b82f6' },
        ].map((s) => (
          <div key={s.label} style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${s.color}20` }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 6px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
          <input placeholder="Tìm theo ID, tên, email, SĐT..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '40px' }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '160px', cursor: 'pointer' }}>
          {ORDER_STATUSES.map((s) => <option key={s.value} value={s.value} style={{ background: '#0f0a24', color: '#fff' }}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(${ACCENT_RGB},0.12)`, borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid rgba(${ACCENT_RGB},0.08)` }}>
                {['ID', 'Khách hàng', 'Ngày đặt', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const st = STATUS_STYLE[o.status] || STATUS_STYLE['Chờ xử lý'];
                const StIcon = st.icon;
                const methodStr = o.payment_method || o.payment_type || 'One-time';
                const pt = PAYMENT_STYLE[methodStr] || { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: CreditCard, label: methodStr };
                const PtIcon = pt.icon;
                const showPayConfirm = shouldShowConfirmPaymentButton(o);

                return (
                  <tr key={o.order_id} style={{ borderBottom: `1px solid rgba(${ACCENT_RGB},0.05)` }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: ACCENT, fontWeight: 700 }}>#{o.order_id}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '14px', color: '#fff', fontWeight: 500 }}>{o.user_name || `User #${o.user_id}`}</div>
                      {o.user_email && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{o.user_email}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{formatDate(o.order_date)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>{formatPrice(o.total_amount)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: pt.color, background: pt.bg }}>
                        <PtIcon style={{ width: 13, height: 13 }} /> {pt.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: st.color, background: st.bg }}>
                        <StIcon style={{ width: 13, height: 13 }} /> {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {showPayConfirm && (
                          <button
                            type="button"
                            onClick={() => handleConfirmPayment(o.order_id)}
                            disabled={completingOrderId === o.order_id}
                            title="PATCH /payments/admin/order/{orderId}/complete — Xác nhận đã thanh toán"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: completingOrderId === o.order_id ? 'not-allowed' : 'pointer',
                              background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,182,212,0.2))',
                              color: '#34d399',
                              fontSize: '11px',
                              fontWeight: 700,
                              whiteSpace: 'nowrap',
                              opacity: completingOrderId === o.order_id ? 0.65 : 1,
                            }}
                          >
                            <CheckCircle2 style={{ width: 14, height: 14, flexShrink: 0 }} />
                            {completingOrderId === o.order_id ? 'Đang xử lý...' : 'Xác nhận TT'}
                          </button>
                        )}
                        <button onClick={() => setViewOrder(o)} title="Xem chi tiết" style={{ padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(16,185,129,0.15)', color: '#34d399', display: 'flex' }}>
                          <Eye style={{ width: 15, height: 15 }} />
                        </button>
                        <button onClick={() => { setEditOrder(o); setEditStatus(o.status); setEditAddress(o.shipping_address || ''); }} title="Cập nhật" style={{ padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: ACCENT_BG, color: ACCENT, display: 'flex' }}>
                          <Pencil style={{ width: 15, height: 15 }} />
                        </button>
                        <button onClick={() => setDeleteTarget(o)} title="Xóa" style={{ padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#f87171', display: 'flex' }}>
                          <Trash2 style={{ width: 15, height: 15 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Không tìm thấy đơn hàng nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setViewOrder(null)} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '560px', background: `linear-gradient(160deg, #1a1508, #0f0e17)`, border: `1px solid rgba(${ACCENT_RGB},0.2)`, borderRadius: '20px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
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
              <InfoBlock label="Mã khuyến mãi"><span style={{ color: viewOrder.promotion_code ? ACCENT : '#6b7280' }}>{viewOrder.promotion_code || 'Không có'}</span></InfoBlock>
            </div>

            {viewOrder.shipping_address && (
              <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(${ACCENT_RGB},0.1)` }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: '0 0 6px' }}>Địa chỉ giao hàng</p>
                <p style={{ fontSize: '14px', color: '#d1d5db', margin: 0, lineHeight: 1.5 }}>{viewOrder.shipping_address}</p>
              </div>
            )}

            {viewOrder.order_items && viewOrder.order_items.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(${ACCENT_RGB},0.1)` }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', margin: '0 0 12px' }}>Sản phẩm đã đặt</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {viewOrder.order_items.map((item, idx) => {
                    const product = item.product_id ? productsMap[item.product_id] : null;
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

            {shouldShowConfirmPaymentButton(viewOrder) && (
              <div style={{ marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => handleConfirmPayment(viewOrder.order_id)}
                  disabled={completingOrderId === viewOrder.order_id}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', cursor: completingOrderId === viewOrder.order_id ? 'not-allowed' : 'pointer', opacity: completingOrderId === viewOrder.order_id ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <CheckCircle2 style={{ width: 18, height: 18 }} />
                  {completingOrderId === viewOrder.order_id ? 'Đang xử lý...' : 'Xác nhận đã thanh toán'}
                </button>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '8px 0 0', textAlign: 'center' }}>
                  API: PATCH /payments/admin/order/<strong style={{ color: '#9ca3af' }}>{viewOrder.order_id}</strong>/complete
                </p>
              </div>
            )}

            <button onClick={() => setViewOrder(null)} style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: `1px solid rgba(${ACCENT_RGB},0.2)`, background: 'transparent', color: '#9ca3af', cursor: 'pointer' }}>Đóng</button>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setEditOrder(null)} />
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px', background: `linear-gradient(160deg, #1a1508, #0f0e17)`, border: `1px solid rgba(${ACCENT_RGB},0.2)`, borderRadius: '20px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Cập nhật đơn #{editOrder.order_id}</h2>
              <button onClick={() => setEditOrder(null)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Trạng thái</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {ORDER_STATUSES.filter(s => s.value !== 'all').map(s => (
                    <option key={s.value} value={s.value} style={{ background: '#0f0a24', color: '#fff' }}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Địa chỉ giao hàng</label>
                <textarea value={editAddress} onChange={(e) => setEditAddress(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder="Địa chỉ giao hàng..." />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setEditOrder(null)} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: `1px solid rgba(${ACCENT_RGB},0.2)`, background: 'transparent', color: '#9ca3af', cursor: 'pointer' }}>Hủy</button>
              <button onClick={handleUpdate} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: 'none', background: `linear-gradient(135deg, ${ACCENT}, #3b82f6)`, color: '#fff', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Đang lưu...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa đơn hàng"
        message={`Bạn chắc chắn muốn xóa đơn hàng #${deleteTarget?.order_id}? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa đơn hàng"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
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
