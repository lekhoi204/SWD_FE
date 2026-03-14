import { useState } from 'react';
import { Search, X, Check, XCircle, Send, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { products } from '@/data/products';
import { PC_BUILDER_CATEGORIES, PC_BUILDER_LABELS } from '@/constants/categories';

type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

type BuildItem = { category: string; productId: string; productName: string; price: number };

type BuildRequest = {
  id: string;
  userName: string;
  userEmail: string;
  budget: number;
  purpose: string;
  note: string;
  currentBuild: BuildItem[];
  status: RequestStatus;
  rejectReason?: string;
  staffBuild?: BuildItem[];
  createdAt: string;
};

const STATUS_MAP: Record<RequestStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: '#f59e0b' },
  accepted: { label: 'Đã duyệt', color: '#3b82f6' },
  rejected: { label: 'Từ chối', color: '#ef4444' },
  completed: { label: 'Hoàn thành', color: '#8b5cf6' },
};

const MOCK_REQUESTS: BuildRequest[] = [
  {
    id: 'REQ-001', userName: 'Nguyễn Văn An', userEmail: 'an.nguyen@gmail.com',
    budget: 30000000, purpose: 'Gaming', note: 'Muốn chơi được game AAA ở 1080p high settings',
    currentBuild: [
      { category: 'cpu', productId: 'cpu-1', productName: 'AMD Ryzen 5 5600X', price: 4990000 },
      { category: 'gpu', productId: 'gpu-1', productName: 'RTX 3060 Ti', price: 11990000 },
    ],
    status: 'pending', createdAt: '2026-03-09',
  },
  {
    id: 'REQ-002', userName: 'Trần Thị Bình', userEmail: 'binh.tran@gmail.com',
    budget: 15000000, purpose: 'Học tập', note: 'Cần máy để học lập trình và chạy Docker',
    currentBuild: [],
    status: 'pending', createdAt: '2026-03-08',
  },
  {
    id: 'REQ-003', userName: 'Lê Văn Cường', userEmail: 'cuong.le@gmail.com',
    budget: 50000000, purpose: 'Đồ hoạ / Render', note: 'Render video 4K, After Effects, Premiere Pro',
    currentBuild: [
      { category: 'cpu', productId: 'cpu-2', productName: 'Intel Core i7-13700K', price: 9990000 },
    ],
    status: 'accepted', createdAt: '2026-03-07',
  },
  {
    id: 'REQ-004', userName: 'Phạm Thị Dung', userEmail: 'dung.pham@gmail.com',
    budget: 20000000, purpose: 'Văn phòng', note: 'Word, Excel, duyệt web cơ bản',
    currentBuild: [],
    status: 'completed', createdAt: '2026-03-06',
    staffBuild: [
      { category: 'cpu', productId: 'cpu-1', productName: 'AMD Ryzen 5 5600X', price: 4990000 },
      { category: 'ram', productId: 'ram-1', productName: 'Corsair 16GB DDR4', price: 1490000 },
      { category: 'storage', productId: 'storage-1', productName: 'Samsung 980 500GB', price: 1890000 },
    ],
  },
  {
    id: 'REQ-005', userName: 'Hoàng Văn Em', userEmail: 'em.hoang@gmail.com',
    budget: 10000000, purpose: 'Gaming', note: 'Budget thấp nhưng muốn chơi Valorant, LOL',
    currentBuild: [],
    status: 'rejected', rejectReason: 'Ngân sách quá thấp để build PC gaming, khuyên mua laptop gaming cũ', createdAt: '2026-03-05',
  },
  {
    id: 'REQ-006', userName: 'Ngô Thị Phương', userEmail: 'phuong.ngo@gmail.com',
    budget: 45000000, purpose: 'Streaming', note: 'Stream Valorant + OBS, cần encode tốt',
    currentBuild: [],
    status: 'pending', createdAt: '2026-03-09',
  },
];

const formatPrice = (p: number) => p.toLocaleString('vi-VN') + 'đ';

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'accepted', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'completed', label: 'Hoàn thành' },
];

export function StaffRequestsPage() {
  const [requests, setRequests] = useState<BuildRequest[]>(MOCK_REQUESTS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReq, setSelectedReq] = useState<BuildRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [staffBuild, setStaffBuild] = useState<BuildItem[]>([]);
  const [showBuildPanel, setShowBuildPanel] = useState(false);

  const filtered = requests.filter((r) => {
    const matchSearch = r.userName.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openDetail = (r: BuildRequest) => {
    setSelectedReq(r);
    setRejectReason('');
    setShowRejectInput(false);
    setStaffBuild(r.staffBuild ?? []);
    setShowBuildPanel(r.status === 'accepted');
  };

  const closeDetail = () => {
    setSelectedReq(null);
    setShowBuildPanel(false);
    setShowRejectInput(false);
  };

  const handleAccept = () => {
    if (!selectedReq) return;
    setRequests((prev) => prev.map((r) => r.id === selectedReq.id ? { ...r, status: 'accepted' as RequestStatus } : r));
    setSelectedReq({ ...selectedReq, status: 'accepted' });
    setShowBuildPanel(true);
    toast.success(`Đã duyệt request ${selectedReq.id}`);
  };

  const handleReject = () => {
    if (!selectedReq || !rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setRequests((prev) => prev.map((r) => r.id === selectedReq.id ? { ...r, status: 'rejected' as RequestStatus, rejectReason } : r));
    toast.success(`Đã từ chối request ${selectedReq.id}`);
    closeDetail();
  };

  const addToBuild = (category: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const existing = staffBuild.findIndex((b) => b.category === category);
    const item: BuildItem = { category, productId, productName: product.name, price: product.price };
    if (existing >= 0) {
      setStaffBuild((prev) => prev.map((b, i) => i === existing ? item : b));
    } else {
      setStaffBuild((prev) => [...prev, item]);
    }
  };

  const removeFromBuild = (category: string) => {
    setStaffBuild((prev) => prev.filter((b) => b.category !== category));
  };

  const handleSendBuild = () => {
    if (!selectedReq) return;
    if (staffBuild.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 linh kiện');
      return;
    }
    setRequests((prev) => prev.map((r) => r.id === selectedReq.id ? { ...r, status: 'completed' as RequestStatus, staffBuild } : r));
    toast.success(`Đã gửi cấu hình cho ${selectedReq.userName}`);
    closeDetail();
  };

  const buildTotal = staffBuild.reduce((s, b) => s + b.price, 0);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };

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
                const st = STATUS_MAP[r.status];
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
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>Không tìm thấy request nào</td></tr>
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
                  color: STATUS_MAP[selectedReq.status].color,
                  background: `${STATUS_MAP[selectedReq.status].color}18`,
                }}>{STATUS_MAP[selectedReq.status].label}</span>
              </div>
              <button onClick={closeDetail} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex' }}>
                <X style={{ width: 22, height: 22 }} />
              </button>
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
                  {selectedReq.currentBuild.map((b) => (
                    <div key={b.category} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(16,185,129,0.08)',
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>{PC_BUILDER_LABELS[b.category as keyof typeof PC_BUILDER_LABELS] ?? b.category}</span>
                        <p style={{ fontSize: '14px', color: '#d1d5db', margin: '2px 0 0' }}>{b.productName}</p>
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

            {/* Completed build */}
            {selectedReq.status === 'completed' && selectedReq.staffBuild && (
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
                        <p style={{ fontSize: '14px', color: '#d1d5db', margin: '2px 0 0' }}>{b.productName}</p>
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

            {/* Build Panel (for accepted) */}
            {showBuildPanel && selectedReq.status === 'accepted' && (
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
                            <span style={{ fontSize: '13px', color: '#d1d5db' }}>{selected.productName}</span>
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
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {selectedReq.status === 'pending' && !showRejectInput && (
                <>
                  <button onClick={handleAccept} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)', color: '#fff', fontSize: '14px', fontWeight: 600,
                  }}>
                    <Check style={{ width: 18, height: 18 }} /> Duyệt
                  </button>
                  <button onClick={() => setShowRejectInput(true)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '12px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer',
                    background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: '14px', fontWeight: 600,
                  }}>
                    <XCircle style={{ width: 18, height: 18 }} /> Từ chối
                  </button>
                </>
              )}

              {showRejectInput && (
                <>
                  <button onClick={handleReject} style={{
                    flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: 600,
                  }}>Xác nhận từ chối</button>
                  <button onClick={() => setShowRejectInput(false)} style={{
                    flex: 1, padding: '12px', borderRadius: '12px', cursor: 'pointer',
                    border: '1px solid rgba(16,185,129,0.2)', background: 'transparent', color: '#9ca3af', fontSize: '14px', fontWeight: 600,
                  }}>Hủy</button>
                </>
              )}

              {selectedReq.status === 'accepted' && showBuildPanel && (
                <button onClick={handleSendBuild} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', fontSize: '14px', fontWeight: 600,
                }}>
                  <Send style={{ width: 18, height: 18 }} /> Gửi cấu hình cho khách
                </button>
              )}

              <button onClick={closeDetail} style={{
                padding: '12px 24px', borderRadius: '12px', cursor: 'pointer',
                border: '1px solid rgba(16,185,129,0.2)', background: 'transparent', color: '#9ca3af', fontSize: '14px', fontWeight: 600,
              }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
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
