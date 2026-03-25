import { useEffect, useState } from 'react';
import { Search, X, Check, XCircle, Send, Trash2, Loader2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { PC_BUILDER_CATEGORIES, PC_BUILDER_LABELS } from '@/constants/categories';
import StaffBuildRequestsApi from '@/api/staffBuildRequests';
import { getProductsApi } from '@/api/products';
import * as UserBuildsApi from '@/api/userBuilds';
import type { Product } from '@/types';
import { ConfirmDialog } from '@/components/ConfirmDialog';

type RequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

type BuildItem = { category: string; productId?: string; productName?: string; name?: string; price: number };

type BuildRequest = {
  id: string;
  userId: number;
  userName: string;
  userEmail: string;
  budget: number;
  purpose: string;
  note: string;
  currentBuild: BuildItem[];
  status: RequestStatus;
  rejectReason?: string;
  staffBuild?: BuildItem[];
  userBuildId?: number | null;
  buildName?: string | null;
  totalPrice?: number | null;
  createdAt: string;
};

const STATUS_MAP: Record<RequestStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: '#f59e0b' },
  assigned: { label: 'Đã phân công', color: '#3b82f6' },
  in_progress: { label: 'Đang xử lý', color: '#6366f1' },
  completed: { label: 'Hoàn thành', color: '#10b981' },
  cancelled: { label: 'Đã hủy', color: '#9ca3af' },
  rejected: { label: 'Từ chối', color: '#ef4444' },
};

const formatPrice = (p: any) => Number(p || 0).toLocaleString('vi-VN') + 'đ';

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'assigned', label: 'Đã phân công' },
  { value: 'in_progress', label: 'Đang xử lý' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'rejected', label: 'Từ chối' },
];

function BuildFromUserBuild({
  userBuildId,
  products,
}: {
  userBuildId: number;
  products: Product[];
}) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const detail = await UserBuildsApi.getUserBuildById(String(userBuildId));
        const raw: any[] =
          detail?.items || detail?.build_items || detail?.data?.items || [];
        if (mounted) setItems(raw || []);
      } catch (err) {
        console.error(err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userBuildId]);

  const normalized = items.map((it: any) => {
    const pid = Number(it.product_id ?? it.productId ?? it.id);
    const qty = Number(it.quantity ?? 1);
    const fallback = products.find((p) => Number(p.id) === pid);
    const name = it.product_name || it.name || fallback?.name || `Product #${pid}`;
    const price = Number(it.product_price || it.price || fallback?.price || 0);
    return { pid, qty, name, price };
  });

  const total = normalized.reduce((s, it) => s + it.price * it.qty, 0);

  if (loading) {
    return <div style={{ padding: '12px', borderRadius: '12px', color: '#9ca3af', background: 'rgba(255,255,255,0.03)' }}>Đang tải...</div>;
  }

  if (normalized.length === 0) {
    return <div style={{ padding: '12px', borderRadius: '12px', color: '#9ca3af', background: 'rgba(255,255,255,0.03)' }}>Không có linh kiện.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {normalized.map((it) => (
        <div key={it.pid} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', borderRadius: '10px', background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.12)',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '14px', color: '#d1d5db' }}>{it.name} (x{it.qty})</p>
          </div>
          <span style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 600 }}>{formatPrice(it.price)}</span>
        </div>
      ))}
      <div style={{ textAlign: 'right', paddingTop: '8px', fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
        Tổng: {formatPrice(total)}
      </div>
    </div>
  );
}

export function StaffRequestsPage() {
  const [requests, setRequests] = useState<BuildRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReq, setSelectedReq] = useState<BuildRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BuildRequest | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [staffBuild, setStaffBuild] = useState<BuildItem[]>([]);
  const [showBuildPanel, setShowBuildPanel] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [reqsRes, prodsRes] = await Promise.all([
          StaffBuildRequestsApi.getAllStaffBuildRequests(),
          getProductsApi({ limit: "1000" })
        ]);
        
        if (mounted) {
          const formatted = (reqsRes || []).map((req: any) => {
            const noteLines = (req.customer_note || '').split('\n');
            let purpose = 'Khác';
            let note = '';
            for (const line of noteLines) {
              if (line.startsWith('Mục đích:')) purpose = line.replace('Mục đích:', '').trim();
              else if (line.startsWith('Ghi chú:')) note = line.replace('Ghi chú:', '').trim();
            }

            return {
              id: String(req.request_id || req.id || ''),
              userId: Number(req.user_id || req.user?.user_id || 0),
              userName: req.user?.username || req.user?.name || req.user_id || 'Khách hàng',
              userEmail: req.user?.email || '',
              budget: req.budget_range || 0,
              purpose,
              note,
              currentBuild: req.buildItems || req.userBuild || [],
              status: req.status || 'pending',
              rejectReason: req.rejectReason,
              staffBuild: req.staffBuild || [],
              userBuildId: req.user_build_id ?? req.userBuildId ?? null,
              buildName: req.build_name ?? req.buildName ?? null,
              totalPrice: req.total_price ?? req.totalPrice ?? null,
              createdAt: req.created_at ? req.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
            };
          });
          setRequests(formatted);
          setProducts(prodsRes || []);
        }
      } catch (err) {
        console.error('Fetch staff requests failed:', err);
        if (mounted) toast.error('Lỗi tải danh sách yêu cầu tư vấn');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = requests.filter((r) => {
    const matchSearch = String(r.userName || '').toLowerCase().includes(search.toLowerCase()) || String(r.id || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openDetail = async (r: BuildRequest) => {
    setSelectedReq(r);
    setRejectReason('');
    setShowRejectInput(false);
    setStaffBuild(r.staffBuild ?? []);
    setShowBuildPanel(r.status === 'in_progress' || r.status === 'assigned');

    // Refresh from API so staff can review what was actually stored/sent
    try {
      const fresh = await StaffBuildRequestsApi.getStaffBuildRequestById(r.id);
      const staffBuildArr = fresh.staffBuild || fresh.staff_build || [];
      const parsedStaffBuild: BuildItem[] = Array.isArray(staffBuildArr)
        ? staffBuildArr
        : [];

      const merged: BuildRequest = {
        ...r,
        userId: Number(fresh.user_id || r.userId || 0),
        userBuildId: fresh.user_build_id ?? r.userBuildId ?? null,
        buildName: fresh.build_name ?? r.buildName ?? null,
        totalPrice: fresh.total_price ?? r.totalPrice ?? null,
        staffBuild: parsedStaffBuild.length ? parsedStaffBuild : (r.staffBuild ?? []),
      };
      setSelectedReq(merged);
      if (merged.staffBuild?.length) setStaffBuild(merged.staffBuild);
    } catch (err) {
      // keep old data
    }
  };

  const closeDetail = () => {
    setSelectedReq(null);
    setShowBuildPanel(false);
    setShowRejectInput(false);
  };

  const handleDeleteRequest = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await StaffBuildRequestsApi.deleteStaffBuildRequest(deleteTarget.id);
      setRequests((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      if (selectedReq?.id === deleteTarget.id) closeDetail();
      toast.success('Đã xóa request');
      setDeleteTarget(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Xóa request thất bại');
    } finally {
      setDeleting(false);
    }
  };

  const updateStatus = async (status: RequestStatus, reason?: string) => {
    if (!selectedReq) return;
    try {
      setActionLoading(true);
      await StaffBuildRequestsApi.updateStaffBuildRequest(selectedReq.id, {
        status,
        ...(reason ? { rejectReason: reason } : {})
      });
      setRequests((prev) => prev.map((r) => r.id === selectedReq.id ? { ...r, status, rejectReason: reason } : r));
      setSelectedReq({ ...selectedReq, status, rejectReason: reason });
      if (status === 'in_progress' || status === 'assigned') setShowBuildPanel(true);
      else closeDetail();
      
      toast.success(status === 'rejected' ? 'Đã từ chối yêu cầu' : 'Đã duyệt yêu cầu');
    } catch (err) {
      console.error('Update request status failed:', err);
      toast.error('Cập nhật trạng thái thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = () => updateStatus('in_progress');
  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    updateStatus('rejected', rejectReason);
  };

  const addToBuild = (category: string, productId: string) => {
    const product = products.find((p) => String(p.id) === String(productId));
    if (!product) return;
    const existing = staffBuild.findIndex((b) => b.category === category);
    const item: BuildItem = { category, productId: String(product.id), productName: product.name, price: product.price };
    if (existing >= 0) {
      setStaffBuild((prev) => prev.map((b, i) => i === existing ? item : b));
    } else {
      setStaffBuild((prev) => [...prev, item]);
    }
  };

  const removeFromBuild = (category: string) => {
    setStaffBuild((prev) => prev.filter((b) => b.category !== category));
  };

  const handleSendBuild = async () => {
    if (!selectedReq) return;
    if (staffBuild.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 linh kiện');
      return;
    }
    try {
      setActionLoading(true);
      if (!selectedReq.userId) {
        toast.error('Request thiếu user_id nên không thể tạo build cho khách');
        return;
      }

      // Create a user_build for the customer so the backend can reference it (user_build_id)
      const buildName = `Build tư vấn #${selectedReq.id}`;
      const items = staffBuild
        .filter((b) => b.productId)
        .map((b) => ({ product_id: Number(b.productId), quantity: 1 }));

      if (items.length === 0) {
        toast.error('Build chưa có productId hợp lệ');
        return;
      }

      const created = await UserBuildsApi.createUserBuild(selectedReq.userId, {
        build_name: buildName,
        items,
      });
      const userBuildId = Number(
        created?.user_build_id || created?.id || created?.build_id,
      );

      const totalPrice = staffBuild.reduce((s, b) => s + (Number(b.price) || 0), 0);

      await StaffBuildRequestsApi.submitBuildForRequest(selectedReq.id, {
        user_build_id: userBuildId || undefined,
        build_name: buildName,
        total_price: totalPrice,
        // keep staffBuild too (in case backend stores it)
        staffBuild,
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedReq.id
            ? { ...r, status: 'completed' as RequestStatus, staffBuild }
            : r,
        ),
      );
      toast.success(`Đã gửi cấu hình cho khách hàng`);
      closeDetail();
    } catch (err) {
      console.error('Send build failed:', err);
      toast.error('Gửi cấu hình thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const buildTotal = staffBuild.reduce((s, b) => s + b.price, 0);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#9ca3af' }}>
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p>Đang tải danh sách yêu cầu...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', margin: 0 }}>Build Requests</h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>Quản lý yêu cầu build PC từ khách hàng</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#9ca3af' }} />
          <input placeholder="Tìm theo tên hoặc mã..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: '40px' }} />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '150px', cursor: 'pointer' }}>
          {FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value} style={{ background: '#0b1120', color: '#fff' }}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.12)',
        borderRadius: '16px', overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
                {['Mã', 'Khách hàng', 'Ngân sách', 'Mục đích', 'Trạng thái', 'Ngày gửi', 'Thao tác'].map((h) => (
                  <th key={h} style={{
                    padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 600,
                    color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(16,185,129,0.05)' }}>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#34d399', fontWeight: 600 }}>{r.id}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontSize: '14px', color: '#fff', fontWeight: 500, margin: 0 }}>{r.userName}</p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{r.userEmail}</p>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#fff', fontWeight: 500 }}>{formatPrice(r.budget)}</td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#9ca3af' }}>{r.purpose}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: 600, color: st.color, background: `${st.color}18`,
                      }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '14px', color: '#9ca3af' }}>{r.createdAt}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <button onClick={() => openDetail(r)} style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '13px', fontWeight: 600,
                      }}>Chi tiết</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 40px', textAlign: 'center', color: '#6b7280' }}>
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p style={{ fontSize: '16px', fontWeight: 500 }}>Không tìm thấy yêu cầu nào</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReq && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={closeDetail} />
          <div style={{
            position: 'relative', zIndex: 1, width: '100%', maxWidth: '700px',
            background: 'linear-gradient(160deg, #0f1d2e, #0b1120)',
            border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '28px',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Request {selectedReq.id}
                </h2>
                <span style={{
                  display: 'inline-block', marginTop: '6px', padding: '3px 10px', borderRadius: '12px',
                  fontSize: '12px', fontWeight: 600,
                  color: STATUS_MAP[selectedReq.status]?.color || '#fff',
                  background: `${STATUS_MAP[selectedReq.status]?.color || '#fff'}18`,
                }}>{STATUS_MAP[selectedReq.status]?.label || selectedReq.status}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setDeleteTarget(selectedReq)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(239,68,68,0.25)',
                    background: 'rgba(239,68,68,0.10)',
                    color: '#f87171',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                  title="Xóa request"
                >
                  <Trash2 style={{ width: 18, height: 18 }} /> Xóa
                </button>
                <button onClick={closeDetail} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}>
                  <X style={{ width: 22, height: 22 }} />
                </button>
              </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <InfoBlock label="Khách hàng" value={selectedReq.userName} />
              <InfoBlock label="Email" value={selectedReq.userEmail} />
              <InfoBlock label="Ngân sách" value={formatPrice(selectedReq.budget)} highlight />
              <InfoBlock label="Mục đích" value={selectedReq.purpose} />
            </div>

            {selectedReq.note && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ghi chú từ khách</p>
                <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <p style={{ fontSize: '14px', color: '#d1d5db', margin: 0, lineHeight: 1.6 }}>{selectedReq.note}</p>
                </div>
              </div>
            )}

            {/* User's current build */}
            {selectedReq.currentBuild.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cấu hình khách đã chọn</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedReq.currentBuild.map((b, i) => (
                    <div key={b.category + i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(16,185,129,0.08)',
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>{PC_BUILDER_LABELS[b.category as keyof typeof PC_BUILDER_LABELS] ?? b.category}</span>
                        <p style={{ fontSize: '14px', color: '#d1d5db', margin: '2px 0 0' }}>{b.productName || b.name}</p>
                      </div>
                      <span style={{ fontSize: '14px', color: '#10b981', fontWeight: 600 }}>{formatPrice(b.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reject reason (if rejected) */}
            {selectedReq.status === 'rejected' && selectedReq.rejectReason && (
              <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>Lý do từ chối</p>
                <p style={{ fontSize: '14px', color: '#fca5a5', margin: 0 }}>{selectedReq.rejectReason}</p>
              </div>
            )}

            {/* Completed build (from backend staffBuild or user_build_id) */}
            {selectedReq.status === 'completed' && selectedReq.userBuildId && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cấu hình đã gửi (lưu trên hệ thống)
                </p>
                <BuildFromUserBuild
                  userBuildId={Number(selectedReq.userBuildId)}
                  products={products}
                />
              </div>
            )}
            {selectedReq.status === 'completed' && selectedReq.staffBuild && selectedReq.staffBuild.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cấu hình staff đã build</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedReq.staffBuild.map((b) => (
                    <div key={b.category} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: '10px', background: 'rgba(139,92,246,0.06)',
                      border: '1px solid rgba(139,92,246,0.12)',
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>{PC_BUILDER_LABELS[b.category as keyof typeof PC_BUILDER_LABELS] ?? b.category}</span>
                        <p style={{ fontSize: '14px', color: '#d1d5db', margin: '2px 0 0' }}>{b.productName || b.name}</p>
                      </div>
                      <span style={{ fontSize: '14px', color: '#a78bfa', fontWeight: 600 }}>{formatPrice(b.price)}</span>
                    </div>
                  ))}
                  <div style={{ textAlign: 'right', paddingTop: '8px', fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>
                    Tổng: {formatPrice(selectedReq.staffBuild.reduce((s, b) => s + b.price, 0))}
                  </div>
                </div>
              </div>
            )}

            {/* Build Panel (for in_progress/assigned) */}
            {showBuildPanel && (selectedReq.status === 'in_progress' || selectedReq.status === 'assigned') && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Build cấu hình cho khách</p>

                {PC_BUILDER_CATEGORIES.map((cat) => {
                  const selected = staffBuild.find((b) => b.category === cat);
                  const available = products.filter((p) => p.category === cat);
                  return (
                    <div key={cat} style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', minWidth: '100px' }}>
                          {PC_BUILDER_LABELS[cat]}
                        </span>
                        {selected ? (
                          <div style={{
                            flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '8px 12px', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                          }}>
                            <span style={{ fontSize: '13px', color: '#d1d5db' }}>{selected.productName || selected.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>{formatPrice(selected.price)}</span>
                              <button onClick={() => removeFromBuild(cat)} style={{
                                background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', padding: '2px',
                              }}>
                                <Trash2 style={{ width: 14, height: 14 }} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <select
                            onChange={(e) => { if (e.target.value) addToBuild(cat, e.target.value); e.target.value = ''; }}
                            style={{ ...inputStyle, flex: 1, cursor: 'pointer', fontSize: '13px', padding: '8px 12px' }}
                          >
                            <option value="" style={{ background: '#0b1120', color: '#fff' }}>-- Chọn {PC_BUILDER_LABELS[cat]} --</option>
                            {available.map((p) => (
                              <option key={p.id} value={p.id} style={{ background: '#0b1120', color: '#fff' }}>{p.name} - {formatPrice(p.price)}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px', borderRadius: '12px', marginTop: '12px',
                  background: buildTotal > selectedReq.budget ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                  border: `1px solid ${buildTotal > selectedReq.budget ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
                }}>
                  <span style={{ fontSize: '14px', color: '#9ca3af' }}>Tổng / Ngân sách</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: buildTotal > selectedReq.budget ? '#f87171' : '#10b981' }}>
                    {formatPrice(buildTotal)} / {formatPrice(selectedReq.budget)}
                  </span>
                </div>
              </div>
            )}

            {/* Reject input */}
            {showRejectInput && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>Lý do từ chối</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Nhập lý do từ chối request này..."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  disabled={actionLoading}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {selectedReq.status === 'pending' && !showRejectInput && (
                <>
                  <button onClick={handleAccept} disabled={actionLoading} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', fontSize: '14px', fontWeight: 600,
                    opacity: actionLoading ? 0.5 : 1
                  }}>
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check style={{ width: 18, height: 18 }} />} Duyệt
                  </button>
                  <button onClick={() => setShowRejectInput(true)} disabled={actionLoading} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                    background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '14px', fontWeight: 600,
                    opacity: actionLoading ? 0.5 : 1
                  }}>
                    <XCircle style={{ width: 18, height: 18 }} /> Từ chối
                  </button>
                </>
              )}

              {showRejectInput && (
                <>
                  <button onClick={handleReject} disabled={actionLoading} style={{
                    flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: 600,
                    opacity: actionLoading ? 0.5 : 1
                  }}>
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Xác nhận từ chối'}
                  </button>
                  <button onClick={() => setShowRejectInput(false)} disabled={actionLoading} style={{
                    flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer',
                    border: '1px solid rgba(16,185,129,0.2)', background: 'transparent', color: '#9ca3af', fontSize: '14px', fontWeight: 600,
                  }}>Hủy</button>
                </>
              )}

              {(selectedReq.status === 'in_progress' || selectedReq.status === 'assigned') && showBuildPanel && (
                <button onClick={handleSendBuild} disabled={actionLoading} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', fontSize: '14px', fontWeight: 600,
                  opacity: actionLoading ? 0.5 : 1
                }}>
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send style={{ width: 18, height: 18 }} />} Gửi cấu hình cho khách
                </button>
              )}

              <button onClick={closeDetail} disabled={actionLoading} style={{
                padding: '12px 24px', borderRadius: '12px', cursor: 'pointer',
                border: '1px solid rgba(16,185,129,0.2)', background: 'transparent', color: '#9ca3af', fontSize: '14px', fontWeight: 600,
                opacity: actionLoading ? 0.5 : 1
              }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa yêu cầu"
        message={`Bạn chắc chắn muốn xóa request #${deleteTarget?.id}? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa request"
        loading={deleting}
        onConfirm={handleDeleteRequest}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function InfoBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ fontSize: '15px', fontWeight: highlight ? 700 : 500, color: highlight ? '#10b981' : '#d1d5db', margin: 0 }}>{value}</p>
    </div>
  );
}
